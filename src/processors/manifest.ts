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
  normalizeJsFilename
} from '../utils'
import { VITE_PLUGIN_CRX_MV3 } from '../constants'
import { emitContentScripts, emitDevScript } from './content_scripts'
import { emitServiceWorkScript } from './background'
import { emitAsset } from './asset'

export function loadManifest(manifestPath:string){
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
  plugins: Plugin[] = []
  assetPaths: string[] = [] // css & icons
  contentScriptPaths: string[] = []
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
    if(serviceworkerPath){
      this.serviceWorkerAbsolutePath = normalizePathResolve(options.srcDir, serviceworkerPath)
    }    
  }

  public reloadManifest(manifestPath:string){
    this.manifest = loadManifest(manifestPath)
  }

  public getHtmlPaths(){
    const manifest = this.manifest
    return [
      manifest.action?.default_popup,
      Object.values(manifest.chrome_url_overrides ?? {}),
      manifest.devtools_page,
      manifest.options_page,
      manifest.options_ui?.page,
      manifest.sandbox?.pages,
    ].flat().filter((x)=>isString(x)).map((p)=>resolve(this.srcDir, p!))
  }

  //generate manifest.json
  public generateManifest(context: PluginContext) {
    let manifest = this.manifest
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
      manifest.options_page = basename(manifest.options_ui?.page)
    }
    if(manifest.sandbox?.pages){
      manifest.sandbox.pages = manifest.sandbox.pages.map((page)=>basename(page))
    }
    for (const key of Object.keys(manifest.chrome_url_overrides||{})) {
        if(manifest.chrome_url_overrides?.[key]){
          manifest.chrome_url_overrides[key] = basename(manifest.chrome_url_overrides[key])
        }
    }
    context.emitFile({
      type: 'asset',
      source: JSON.stringify(manifest, null , 2),
      fileName: 'manifest.json'
    })
  }

  // public async transform(code: string, id: string, context: PluginContext) {    
  //   let data = ''
  //   if (this.serviceWorkerAbsolutePath === id) {
  //     data += readFileSync(resolve(__dirname, 'client/background.js'), 'utf8')
  //   }
  //   let source = await generageDynamicImportScript(context, this, code)
  //   source = await generageDynamicImportAsset(context, this, source)

  //   return data + source
  // }

  public async generateServiceWorkScript(context: PluginContext){
    if(this.manifest.background?.service_worker){
      context.addWatchFile(this.serviceWorkerAbsolutePath!)
      await emitServiceWorkScript(context, this)
      this.manifest.background.service_worker = normalizeJsFilename(this.manifest.background.service_worker)
    }
  }

  public async generateContentScript(context: PluginContext) {
    const { contentScriptPaths, manifest } =
      await emitContentScripts(context, this)
    this.contentScriptPaths = contentScriptPaths
    this.manifest = manifest
    this.manifest = await emitDevScript(context, this)
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
