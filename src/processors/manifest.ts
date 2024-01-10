import { PluginContext, InputPluginOption, watch } from 'rollup'
import type { Plugin } from 'vite'
import type {
  ChromeExtensionManifest,
  ContentScript,
  ProcessorOptions
} from '../manifest'
import { basename, resolve, dirname, join } from 'path'
import {
  isJsonString,
  normalizeJsFilename,
  normalizePathResolve,
  normalizePath,
  isObject,
  isString,
  emitFile,
  getContentFromCache,
  normalizeCssFilename,
  removeCommentsFromCode,
  extractWebAccessibleResources
} from '../utils'
import { VITE_PLUGIN_CRX_MV3 } from '../constants'
import * as serviceWorkParse from './serviceWork'
import * as contentScriptsParse from './contentScripts'
import { emitAsset } from './asset'

export class ManifestProcessor {
  cache: Map<string, any> = new Map()
  plugins: Plugin[] = []
  assetPaths: string[] = [] // css & icons
  contentScriptChunkModules: string[] = []
  webAccessibleResources: string[] = []
  srcDir: string
  serviceWorkerAbsolutePath: string | undefined
  manifest: Partial<ChromeExtensionManifest> = {}
  options: ProcessorOptions
  packageJsonPath = ''

  constructor(options: ProcessorOptions) {
    this.options = options
    this.srcDir = dirname(options.manifestPath)
    this.plugins = options.viteConfig.plugins.filter(
      (p) => p.name !== VITE_PLUGIN_CRX_MV3
    )
    let manifestAbsolutPath = normalizePathResolve(
      options.viteConfig.root,
      options.manifestPath
    )
    try {
      this.packageJsonPath = normalizePath(join(process.cwd(), 'package.json'))
    } catch (error) {}
    if (options.viteConfig.build.watch)
      this.watchPackageJson(this.packageJsonPath)
    this.loadManifest(manifestAbsolutPath)
  }

  private watchPackageJson(input) {
    if (!input) return
    const watcher = watch({ input })
    watcher.on('event', (event) => {
      if (event.code == 'START') {
        this.cache.delete(input)
      }
    })
  }

  public async doBuild(context, filePath) {
    const { rollup } = await import('rollup')
    const fileFullPath = normalizePathResolve(this.srcDir, filePath)
    context.addWatchFile(fileFullPath)
    const bundle = await rollup({
      context: 'globalThis',
      input: fileFullPath,
      plugins: this.plugins as InputPluginOption,
      cache: this.cache.get(fileFullPath)
    })
    if (!this.cache.has(fileFullPath)) {
      this.cache.set(fileFullPath, bundle.cache)
    }
    try {
      const { output } = await bundle.generate({
        entryFileNames: normalizeJsFilename(filePath)
      })
      const outputChunk = output[0]
      context.emitFile({
        type: 'asset',
        source: outputChunk.code,
        fileName: outputChunk.fileName
      })
    } finally {
      await bundle.close()
    }
  }

  public async loadManifest(manifestPath: string) {
    /* --------------- LOAD PACKAGE.JSON --------------- */
    let packageJson = {}
    if (this.packageJsonPath) {
      let content = await getContentFromCache(this.cache, this.packageJsonPath)
      packageJson = JSON.parse(content as string)
    }
    /* --------------- LOAD MANIFEST.JSON --------------- */
    let manifestContent = (await getContentFromCache(
      this.cache,
      manifestPath,
      'utf8'
    )) as string

    if (!isJsonString(manifestContent)) {
      throw new Error('The manifest.json is not valid.')
    }
    const manifest = JSON.parse(manifestContent)
    manifest.name =
      !manifest.name || manifest.name == 'auto'
        ? packageJson.name
        : manifest.name
    manifest.version =
      !manifest.version || manifest.version == 'auto'
        ? packageJson.version
        : manifest.version

    if (!manifest.name) {
      throw new Error('The name field of manifest.json is required.')
    }
    if (!manifest.version) {
      throw new Error('The version field of manifest.json is required.')
    }
    if (!manifest.manifest_version) {
      throw new Error(
        'The manifest_version field of manifest.json is required.'
      )
    }
    this.manifest = manifest
    let serviceworkerPath = this.manifest.background?.service_worker
    this.serviceWorkerAbsolutePath = serviceworkerPath
      ? normalizePathResolve(this.srcDir, serviceworkerPath)
      : ''
  }

  public async reLoadManifest(manifestPath: string) {
    await this.loadManifest(manifestPath)
    this.webAccessibleResources = []
  }

  public clearCacheById(context, id) {
    if (context.cache.has(id)) {
      context.cache.delete(id)
    }
    if (this.cache.has(id)) {
      this.cache.delete(id)
    }
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
      let swPath = normalizePathResolve(__dirname, 'client/sw.js')
      let content = await getContentFromCache(context.cache, swPath, 'utf8')
      data += content
    }
    if (
      this.getContentScriptPaths().includes(id) ||
      this.serviceWorkerAbsolutePath === id
    ) {
      code = removeCommentsFromCode(code)
    }
    code = await contentScriptsParse.generageDynamicImportScript(
      context,
      this,
      code
    )
    code = await serviceWorkParse.generageDynamicImports(context, this, code)

    return { code: data + code, map: null}; 
  }

  public async generateDevScript(context, port, reloadPage) {
    this.manifest = await contentScriptsParse.emitDevScript(
      context,
      port,
      this,
      reloadPage
    )
  }

  //generate manifest.json
  public async generateManifest(context: PluginContext, bundle, bundleMap) {
    let manifest = this.manifest
    for (const item of manifest.content_scripts ?? []) {
      for (const [index, css] of (item.css ?? []).entries()) {
        if (item.css) {
          item.css[index] = normalizeCssFilename(css)
        }
      }
      for (const [index, script] of (item.js ?? []).entries()) {
        let scriptAbsolutePath = normalizePathResolve(this.srcDir, script)
        let chunk = bundleMap[scriptAbsolutePath]
        if (chunk) {
          let importedCss = [...chunk.viteMetadata.importedCss]
          this.webAccessibleResources = [
            ...this.webAccessibleResources,
            ...extractWebAccessibleResources(chunk.code),
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
        ...manifest.background,
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
    let assetPaths: string[] = []
    const defaultIcon = this.manifest?.action?.default_icon
    if (defaultIcon && isString(defaultIcon)) {
      assetPaths = [defaultIcon]
    } else if (isObject(defaultIcon)) {
      let defaultIconPaths = Object.values(defaultIcon)
      assetPaths = [...assetPaths, ...defaultIconPaths]
    }
    if (isObject(this.manifest.icons)) {
      let iconPaths = Object.values(this.manifest.icons)
      assetPaths = [...assetPaths, ...iconPaths]
    }
    if (Array.isArray(this.manifest.content_scripts)) {
      this.manifest.content_scripts.forEach((item: ContentScript) => {
        if (Array.isArray(item.css)) {
          assetPaths = [...assetPaths, ...item.css]
        }
      })
    }
    return assetPaths
  }

  // icon & content_scripts.css
  public async generateAsset(context: PluginContext) {
    this.assetPaths = this.getAssetPaths()
    for (const path of this.assetPaths) {
      let fullPath = normalizePathResolve(this.srcDir, path)
      context.addWatchFile(fullPath)
      emitAsset(context, path, fullPath)
    }
  }
}
