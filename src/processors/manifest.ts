import rollup, { PluginContext } from 'rollup'
import type { Plugin } from 'vite'
import type {
  ChromeExtensionManifest,
  ContentScript,
  ProcessorOptions
} from '../manifest'
import { resolve, dirname, basename } from 'path'
import { readFileSync } from 'fs'
import {
  isJsonString,
  normalizeCssFilename,
  normalizePathResolve,
  normalizeJsFilename,
  isObject
} from '../utils'
import { VITE_PLUGIN_CRX_MV3 } from '../constants'
import { generageContentScripts, generateScriptForDev } from './content_scripts'
import {
  generageDynamicImportScript,
  generageDynamicImportAsset
} from './background'
import { emitAsset } from './asset'

export class ManifestProcessor {
  plugins: Plugin[]
  serviceWorkerPath: string | undefined
  serviceWorkerFullPath: string | undefined
  defaultPopupPath: string | undefined
  optionsPagePath: string | undefined
  devtoolsPagePath: string | undefined
  assetPaths: string[] = [] // css & icons
  contentScriptPaths: string[] = []
  srcDir: string
  manifestContent: Partial<ChromeExtensionManifest> = {}
  originalManifestContent: Partial<ChromeExtensionManifest> = {}
  options: ProcessorOptions

  constructor(options: ProcessorOptions) {
    this.options = options
    this.srcDir = dirname(options.manifestPath)
    this.plugins = options.viteConfig.plugins.filter(
      (p) => p.name !== VITE_PLUGIN_CRX_MV3
    )
    this.loadManifest()

    const manifestWatcher = rollup.watch({ input: options.manifestPath })
    manifestWatcher.on('event', (event) => {
      if (event.code === 'START') {
        this.loadManifest()
      }
    })
  }

  public async loadManifest() {
    const manifestRaw = readFileSync(this.options.manifestPath, 'utf8')
    if (!isJsonString(manifestRaw)) {
      throw new Error('The manifest.json is not valid.')
    }
    this.originalManifestContent = JSON.parse(manifestRaw)
    if (!this.originalManifestContent.name) {
      throw new Error('The name field of manifest.json is required.')
    }
    if (!this.originalManifestContent.version) {
      throw new Error('The version field of manifest.json is required.')
    }
    if (!this.originalManifestContent.manifest_version) {
      throw new Error(
        'The manifest_version field of manifest.json is required.'
      )
    }
    this.serviceWorkerPath =
      this.originalManifestContent?.background?.service_worker
    if (this.serviceWorkerPath) {
      this.serviceWorkerFullPath = normalizePathResolve(
        this.srcDir,
        this.serviceWorkerPath
      )
    }
    this.defaultPopupPath = this.originalManifestContent?.action?.default_popup
    this.optionsPagePath = this.originalManifestContent.options_page
    this.devtoolsPagePath = this.originalManifestContent.devtools_page
  }

  //generate manifest.json
  public generateManifest(context: PluginContext) {
    let manifestContent: ChromeExtensionManifest | Record<string, any> =
      this.manifestContent

    if (this.serviceWorkerPath) {
      manifestContent.background.service_worker = normalizeJsFilename(
        this.serviceWorkerPath
      )
    }
    if (this.defaultPopupPath) {
      manifestContent.action.default_popup = basename(this.defaultPopupPath)
    }
    if (this.optionsPagePath) {
      manifestContent.options_page = basename(this.optionsPagePath)
    }
    if (this.devtoolsPagePath) {
      manifestContent.devtools_page = basename(this.devtoolsPagePath)
    }
    if (Array.isArray(manifestContent.content_scripts)) {
      manifestContent.content_scripts.forEach((item: ContentScript) => {
        if (Array.isArray(item.js)) {
          item.js = item.js.map((item) => normalizeJsFilename(item))
        }
        if (Array.isArray(item.css)) {
          item.css = item.css.map((item) => normalizeCssFilename(item))
        }
      })
    }
    context.emitFile({
      type: 'asset',
      source: JSON.stringify(this.manifestContent),
      fileName: 'manifest.json'
    })
  }

  public async transform(code: string, id: string, context: PluginContext) {
    let data = '',
      srcDir = this.srcDir
    if (this.serviceWorkerFullPath === id) {
      data = `var PORT=${this.options.port};`
      data += readFileSync(resolve(__dirname, 'client/background.js'), 'utf8')
    }
    let source = await generageDynamicImportScript(context, this, code)
    source = await generageDynamicImportAsset(context, srcDir, source)

    return data + source
  }

  public async generateBundle(context: PluginContext) {
    const { contentScriptPaths, manifestContent } =
      await generageContentScripts(context, this)
    this.contentScriptPaths = contentScriptPaths
    this.manifestContent = manifestContent
    this.manifestContent = await generateScriptForDev(context, this)
    //watch manifest.json
    if (this.options.manifestPath) {
      context.addWatchFile(this.options.manifestPath)
    }
  }

  public async getAssetPaths() {
    this.manifestContent = JSON.parse(
      JSON.stringify(this.originalManifestContent)
    )
    this.assetPaths = []
    const defaultIcon = this.manifestContent?.action?.default_icon
    if (defaultIcon && typeof defaultIcon === 'string') {
      this.assetPaths = [defaultIcon]
    } else if (isObject(defaultIcon)) {
      let defaultIconPaths = Object.keys(defaultIcon).map((key) => {
        return defaultIcon[key]
      })
      this.assetPaths = [...this.assetPaths, ...defaultIconPaths]
    }
    if (isObject(this.manifestContent.icons)) {
      let iconPaths = Object.keys(this.manifestContent.icons).map((key) => {
        return this.manifestContent.icons?.[key]
      })
      this.assetPaths = [...this.assetPaths, ...iconPaths]
    }
    if (Array.isArray(this.manifestContent.content_scripts)) {
      this.manifestContent.content_scripts.forEach((item: ContentScript) => {
        if (Array.isArray(item.css)) {
          this.assetPaths = [...this.assetPaths, ...item.css]
        }
      })
    }
  }

  // icon & css
  public async generateAssets(context: PluginContext) {
    for (const path of this.assetPaths) {
      emitAsset(context, this.srcDir, path)
    }
  }
}
