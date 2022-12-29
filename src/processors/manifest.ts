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

export function loadManifest(manifestPath) {
  const manifestRaw = readFileSync(manifestPath, 'utf8')
  if (!isJsonString(manifestRaw)) {
    throw new Error('The manifest.json is not valid.')
  }
  const manifestContent = JSON.parse(manifestRaw)
  if (!manifestContent.name) {
    throw new Error('The name field of manifest.json is required.')
  }
  if (!manifestContent.version) {
    throw new Error('The version field of manifest.json is required.')
  }
  if (!manifestContent.manifest_version) {
    throw new Error('The manifest_version field of manifest.json is required.')
  }
  return manifestContent
}

export class ManifestProcessor {
  plugins: Plugin[]
  serviceWorkerPath: string | undefined
  serviceWorkerFullPath: string | undefined
  defaultPopupPath: string | undefined
  optionsPagePath: string | undefined
  devtoolsPagePath: string | undefined
  overridePagePath: string | undefined
  historyPagePath: string | undefined
  bookmarksPagePath: string | undefined
  assetPaths: string[] = [] // css & icons
  contentScriptPaths: string[] = []
  srcDir: string
  manifestContent: Partial<ChromeExtensionManifest> = {}
  originalManifestContent: Partial<ChromeExtensionManifest> = {}
  options: ProcessorOptions

  constructor(options: ProcessorOptions) {
    let manifestPath = options.manifestPath
    this.options = options
    this.srcDir = dirname(manifestPath)
    this.plugins = options.viteConfig.plugins.filter(
      (p) => p.name !== VITE_PLUGIN_CRX_MV3
    )
    this.originalManifestContent = options.manifestContent
    this.getPagePath()

    const manifestWatcher = rollup.watch({ input: manifestPath })
    manifestWatcher.on('event', (event) => {
      if (event.code === 'START') {
        this.originalManifestContent = loadManifest(manifestPath)
        this.getPagePath()
      }
    })
  }

  private getPagePath() {
    const originalManifestContent = this.originalManifestContent
    this.serviceWorkerPath = originalManifestContent?.background?.service_worker
    if (this.serviceWorkerPath) {
      this.serviceWorkerFullPath = normalizePathResolve(
        this.srcDir,
        this.serviceWorkerPath
      )
    }
    this.defaultPopupPath = originalManifestContent?.action?.default_popup
    this.optionsPagePath = originalManifestContent.options_page || originalManifestContent?.options_ui?.page
    this.devtoolsPagePath = originalManifestContent.devtools_page
    const chrome_url_overrides = originalManifestContent.chrome_url_overrides
    if (chrome_url_overrides) {
      this.overridePagePath = chrome_url_overrides?.newtab
      this.bookmarksPagePath = chrome_url_overrides?.bookmarks
      this.historyPagePath = chrome_url_overrides?.history
    }
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
    if (this.devtoolsPagePath) {
      manifestContent.devtools_page = basename(this.devtoolsPagePath)
    }
    if (manifestContent.options_page && this.optionsPagePath) {
      manifestContent.options_page = basename(this.optionsPagePath)
    }
    if (manifestContent?.options_ui?.page && this.optionsPagePath) {
      manifestContent.options_ui.page = basename(this.optionsPagePath)
    }
    if (manifestContent.chrome_url_overrides) {
      if (this.overridePagePath) {
        manifestContent.chrome_url_overrides.newtab = basename(this.overridePagePath)
      }
      if (this.historyPagePath) {
        manifestContent.chrome_url_overrides.history = basename(this.historyPagePath)
      }
      if (this.bookmarksPagePath) {
        manifestContent.chrome_url_overrides.bookmarks = basename(this.bookmarksPagePath)
      }
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
