import { PluginContext } from 'rollup'
import type { Plugin } from 'vite'
import type {
  ChromeExtensionManifest,
  ContentScript,
  ProcessorOptions
} from '../manifest'
import { basename, resolve } from 'path'
import { readFileSync } from 'fs'
import {
  isJsonString,
  normalizePathResolve,
  isObject,
  isString,
  emitFile
} from '../utils'
import { VITE_PLUGIN_CRX_MV3 } from '../constants'
import {
  generageDynamicImportScript,
  generageDynamicImportAsset
} from './background'
import { emitAsset } from './asset'
import { generageDynamicImport, emitDevScript } from './content_scripts'

export function loadManifest(manifestPath: string) {
  const manifestRaw = readFileSync(manifestPath, 'utf8')
  if (!isJsonString(manifestRaw)) {
    throw new Error('The manifest.json is not valid.')
  }
  const manifest = JSON.parse(manifestRaw)
  if (!manifest.name) {
    throw new Error('The name field of manifest.json is required.')
  }
  if (!manifest.version) {
    throw new Error('The version field of manifest.json is required.')
  }
  if (!manifest.manifest_version) {
    throw new Error('The manifest_version field of manifest.json is required.')
  }
  return manifest
}

export class ManifestProcessor {

  private cache = {} 
  plugins: Plugin[] = []
  assetPaths: string[] = [] // css & icons
  contentScriptChunkModules: string[] = []
  webAccessibleResources: string[] = []
  srcDir: string
  serviceWorkerAbsolutePath: string | undefined
  manifest: Partial<ChromeExtensionManifest> = {}
  options: ProcessorOptions

  constructor(options: ProcessorOptions) {
    this.options = options
    this.srcDir = options.srcDir
    this.manifest = options.manifest
    this.plugins = options.viteConfig.plugins.filter(
      (p) => p.name !== VITE_PLUGIN_CRX_MV3
    )
    let serviceworkerPath = this.manifest.background?.service_worker
    if (serviceworkerPath) {
      this.serviceWorkerAbsolutePath = normalizePathResolve(
        options.srcDir,
        serviceworkerPath
      )
    }
  }

  public reloadManifest(manifestPath: string) {
    this.manifest = loadManifest(manifestPath)
    this.contentScriptChunkModules = []
    this.webAccessibleResources = []
    this.cache = {}
  }

  public getHtmlPaths() {
    const manifest = this.manifest
    return [
      manifest.action?.default_popup,
      Object.values(manifest.chrome_url_overrides ?? {}),
      manifest.devtools_page,
      manifest.options_page,
      manifest.options_ui?.page,
      manifest.sandbox?.pages
    ]
      .flat()
      .filter((x) => isString(x))
      .map((p) => resolve(this.srcDir, p!))
  }

  public getContentScriptPaths() {
    let paths: string[] = []
    for (const item of this.manifest.content_scripts ?? []) {
      if (Array.isArray(item.js)) {
        paths = [...paths, ...item.js]
      }
    }
    return paths.map((p) => normalizePathResolve(this.srcDir, p!))
  }

  public async transform(code: string, id: string, context: PluginContext) {
    let data = ''
    if (this.serviceWorkerAbsolutePath === id) {
      data += readFileSync(resolve(__dirname, 'client/background.js'), 'utf8')
    }
    code = await generageDynamicImport(context, this, code)
    code = await generageDynamicImportScript(context, this, code)
    code = await generageDynamicImportAsset(context, this, code)
    return data + code
  }

  //generate manifest.json
  public async generateManifest(context: PluginContext, bundle, bundleMap) {
    this.manifest = await emitDevScript(context, this)
    let manifest = this.manifest
    for (const item of manifest.content_scripts ?? []) {
      for (const [index, script] of (item.js ?? []).entries()) {
        let scriptAbsolutePath = normalizePathResolve(
          this.options.srcDir,
          script
        )
        let chunk = bundleMap[scriptAbsolutePath]
        if (chunk) {
          // console.log('chunk', chunk)
          this.contentScriptChunkModules = [
            ...this.contentScriptChunkModules,
            ...Object.keys(chunk.modules)
          ]
          let importedCss = [...chunk.viteMetadata.importedCss]
          let importedAssets = [...chunk.viteMetadata.importedAssets]
          this.webAccessibleResources = [
            ...this.webAccessibleResources,
            ...importedCss,
            ...importedAssets,
            ...chunk.imports,
            chunk.fileName
          ]
          for (const chunkImport of chunk.imports) {
            if (bundle[chunkImport]) {
              let importedCss = bundle[chunkImport].viteMetadata.importedCss
              item.css = [...(item.css ?? []), ...importedCss]
            }
          }
          if (importedCss.length) {
            item.css = [...(item.css ?? []), ...importedCss]
          }
          item.js![index] = 'contentscript-loader-' + basename(chunk.fileName)
          let content = `(function () {
            (async () => {
                  await import(
                    chrome.runtime.getURL("${chunk.fileName}")
                  );
                })().catch(console.error);
            })();`
          let outDir = this.options.viteConfig.build.outDir
          let outputPath = outDir + '/' + item.js![index]
          await emitFile(outputPath, content)
          console.log(`\n${outDir}/\x1B[32m${item.js![index]}\x1B[`)
        }
      }
    }
    if (this.serviceWorkerAbsolutePath) {
      manifest.background = {
        service_worker: bundleMap[this.serviceWorkerAbsolutePath].fileName
      }
    }
    if (manifest.action?.default_popup) {
      manifest.action.default_popup = basename(manifest.action.default_popup)
    }
    if (manifest.devtools_page) {
      manifest.devtools_page = basename(manifest.devtools_page)
    }
    if (manifest.options_page) {
      manifest.options_page = basename(manifest.options_page)
    }
    if (manifest.options_ui?.page) {
      manifest.options_ui.page = basename(manifest.options_ui.page)
    }
    if (manifest.sandbox?.pages) {
      manifest.sandbox.pages = manifest.sandbox.pages.map((page) =>
        basename(page)
      )
    }
    for (const key of Object.keys(manifest.chrome_url_overrides || {})) {
      if (manifest.chrome_url_overrides?.[key]) {
        manifest.chrome_url_overrides[key] = basename(
          manifest.chrome_url_overrides[key]
        )
      }
    }
    if (this.webAccessibleResources.length) {
      manifest.web_accessible_resources = [
        ...(manifest.web_accessible_resources ?? []),
        {
          matches: ['<all_urls>'],
          resources: this.webAccessibleResources,
          use_dynamic_url: true
        }
      ]
    }
    context.emitFile({
      type: 'asset',
      source: JSON.stringify(manifest, null, 2),
      fileName: 'manifest.json'
    })
  }

  public getAssetPaths() {
    this.assetPaths = []
    const defaultIcon = this.manifest?.action?.default_icon
    if (defaultIcon && isString(defaultIcon)) {
      this.assetPaths = [defaultIcon]
    } else if (isObject(defaultIcon)) {
      let defaultIconPaths = Object.values(defaultIcon)
      this.assetPaths = [...this.assetPaths, ...defaultIconPaths]
    }
    if (isObject(this.manifest.icons)) {
      let iconPaths = Object.values(this.manifest.icons)
      this.assetPaths = [...this.assetPaths, ...iconPaths]
    }
    if (Array.isArray(this.manifest.content_scripts)) {
      this.manifest.content_scripts.forEach((item: ContentScript) => {
        if (Array.isArray(item.css)) {
          this.assetPaths = [...this.assetPaths, ...item.css]
        }
      })
    }
  }

  // icon & content_scripts.css
  public async generateAsset(context: PluginContext) {
    this.getAssetPaths()
    for (const path of this.assetPaths) {
      emitAsset(context, this.srcDir, path)
    }
  }
}
