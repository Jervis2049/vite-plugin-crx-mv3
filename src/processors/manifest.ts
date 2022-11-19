import { PluginContext } from 'rollup'
import type { ResolvedConfig, Plugin } from 'vite'
import type { ChromeExtensionManifest, ContentScript } from '../manifest'
import { resolve, dirname, normalize, basename } from 'path'
import { readFileSync } from 'fs'
import { cloneDeep } from 'lodash-es'
import {
  isJsonString,
  normalizeCssFilename,
  normalizePathResolve,
  normalizeJsFilename
} from '../utils'
import { VITE_PLUGIN_CRX_MV3 } from '../constants'
import { compileSass } from '../compiler/compile-sass'
import { compileLess } from '../compiler/compile-less'
import { generageContentScripts, generateScriptForDev } from './content_scripts'

interface Options {
  manifestPath: string
  port: number
  viteConfig: ResolvedConfig
}

export class ManifestProcessor {
  public plugins: Plugin[]
  public serviceWorkerPath: string | undefined
  public defaultPopupPath: string | undefined
  public optionsPagePath: string | undefined
  public assetPaths: string[] = [] // css & icons
  public srcDir: string
  public manifestContent: Partial<ChromeExtensionManifest> = {}
  public originalManifestContent: Partial<ChromeExtensionManifest> = {}

  constructor(private options = {} as Options) {
    this.options = options
    this.srcDir = dirname(options.manifestPath)
    this.plugins = options.viteConfig.plugins.filter(
      (p) => p.name !== VITE_PLUGIN_CRX_MV3
    )
    this.readManifest()
  }

  public async transform(code: string, id: string) {
    let data = ''
    if (normalizePathResolve(this.srcDir, this.serviceWorkerPath) === id) {
      data = `var PORT=${this.options.port};`
      data += readFileSync(resolve(__dirname, 'client/background.js'), 'utf8')
    }
    if (code.indexOf('chrome.scripting.executeScript') > 0) {
      code = code.replace(
        /(?<=chrome.scripting.executeScript\()[\s\S]*?(?=\))/gm,
        function (fileStr) {
          return normalizeJsFilename(fileStr)
        }
      )
    }
    return data + code
  }

  public async readManifest() {
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
    this.defaultPopupPath = this.originalManifestContent?.action?.default_popup
    this.optionsPagePath = this.originalManifestContent.options_page
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

  public async generateBundle(context: PluginContext) {
    this.manifestContent = await generageContentScripts(context, this)
    this.manifestContent = await generateScriptForDev(context, this)
  }

  public async getAssetPaths() {
    this.manifestContent = cloneDeep(this.originalManifestContent)
    this.assetPaths = []
    if (this.manifestContent.icons) {
      const icons = Object.keys(this.manifestContent.icons)
      if (Array.isArray(icons)) {
        let iconPaths = icons.map((key) => {
          return this.manifestContent.icons?.[key]
        })
        this.assetPaths = [...this.assetPaths, ...iconPaths]
      }
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
  public async emitAssets(context: PluginContext) {
    for (const path of this.assetPaths) {
      const assetPath = resolve(this.srcDir, path)
      context.addWatchFile(assetPath)
      if (assetPath.endsWith('.less')) {
        await compileLess(context, path, assetPath)
      } else if (assetPath.endsWith('.scss')) {
        await compileSass(context, path, assetPath)
      } else {
        let content = readFileSync(assetPath)
        context.emitFile({
          type: 'asset',
          source: content,
          fileName: normalize(path)
        })
      }
    }
  }
}
