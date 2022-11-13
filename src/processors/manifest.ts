import type { ResolvedConfig } from 'vite'
import type { ChromeExtensionManifest, ContentScript } from '../manifest'
import { resolve, dirname, normalize } from 'path'
import { promisify } from 'util'
import fs from 'fs'
import less from 'less'
import {
  isJsonString,
  normalizeCssFilename,
  normalizePathResolve,
  normalizeJsFilename,
  relaceCssUrlPrefix,
  relaceImgUrlPrefix,
  convertIntoIIFE
} from '../utils'
import { VITE_PLUGIN_CRX_MV3 } from '../constants'

const readFile = promisify(fs.readFile)

interface Options {
  manifestPath: string
  port: number
  viteConfig: ResolvedConfig
}

export class ManifestProcessor {
  public contentScriptDevPath = 'content-scripts/content-dev.js'
  public serviceWorkerDevPath = 'background-dev.js'
  public serviceWorkerPath: string | undefined // service_worker
  public contentScriptPaths: string[] = [] //content_scripts
  public assetPaths: string[] = [] // css & icons
  public srcDir: string
  public manifestContent: ChromeExtensionManifest = {}

  constructor(private options = {} as Options) {
    this.options = options
    this.srcDir = dirname(options.manifestPath)
    this.plugins = options.viteConfig.plugins.filter(
      (p) => p.name !== VITE_PLUGIN_CRX_MV3
    )
  }

  public async generageContentScripts(context): Promise<void> {
    let { manifestPath } = this.options
    const { rollup } = await import('rollup')
    context.addWatchFile(manifestPath)
    for (const script of this.manifestContent.content_scripts || []) {
      for (const js of script.js || []) {
        const build = await rollup({
          input: resolve(this.srcDir, js),
          plugins: this.plugins
        })
        let outputs = (
          await build.generate({
            entryFileNames: 'content-scripts/[name].js'
            // format: "iife"
          })
        ).output

        build.watchFiles.forEach((path) => {
          context.addWatchFile(path)
        })
        const outputChunk = outputs[0]
        const viteMetadata = outputChunk?.viteMetadata
        const importedCss = [
          ...(viteMetadata?.importedCss ? viteMetadata.importedCss : [])
        ]
        const importedAssets = [
          ...(viteMetadata?.importedAssets ? viteMetadata.importedAssets : [])
        ]
        const cssSource = outputs.filter((x) =>
          importedCss.includes(x.fileName)
        )
        const assetsSource = outputs.filter((item) =>
          importedAssets.includes(item.fileName)
        )

        if (cssSource.length) {
          script.css = [
            ...(script.css ?? []),
            ...cssSource.map((x) => x.fileName)
          ]
        }

        [outputChunk, ...cssSource, ...assetsSource].map((x) => {
          let content = x.code
            ? convertIntoIIFE(relaceImgUrlPrefix(x.code))
            : relaceCssUrlPrefix(x.source)
          context.emitFile({
            type: 'asset',
            source: content,
            fileName: x.fileName
          })
        })
      }
    }
  }

  public async transform(code: string, id: string) {
    let data = ''
    if (this.serviceWorkerPath === id) {
      data = `var PORT=${this.options.port};`
      data += fs.readFileSync(
        resolve(__dirname, 'client/background.js'),
        'utf8'
      )
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
    let manifestRaw = await readFile(this.options.manifestPath, 'utf8')
    if (!isJsonString(manifestRaw)) {
      throw new Error('The manifest.json is not valid.')
    }
    this.manifestContent = JSON.parse(manifestRaw)
  }

  public async getAssetPaths() {
    await this.readManifest()
    this.contentScriptPaths = []
    this.assetPaths = []
    let service_worker = this.manifestContent?.background?.service_worker
    if (service_worker) {
      this.serviceWorkerPath = normalizePathResolve(this.srcDir, service_worker)
    }
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
        if (Array.isArray(item.js)) {
          this.contentScriptPaths = [...this.contentScriptPaths, ...item.js]
        }
        if (Array.isArray(item.css)) {
          this.assetPaths = [...this.assetPaths, ...item.css]
        }
      })
    }
    return [
      service_worker,
      this.manifestContent?.action?.default_popup,
      this.manifestContent?.options_page
    ].filter((x) => !!x)
  }

  //generate manifest.json
  public emitManifest(context) {
    let manifestContent: ChromeExtensionManifest | Record<string, any> =
      this.manifestContent
    let serviceWorker = manifestContent?.background?.service_worker
    if (serviceWorker) {
      manifestContent.background.service_worker = normalizeJsFilename(
        manifestContent.background.service_worker
      )
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
  // generate scripts for dev
  public async emitScriptForDev(context) {
    let { viteConfig, port } = this.options
    if (viteConfig.mode !== 'production') {
      let code = `var PORT=${port};`
      if (!this.serviceWorkerPath) {
        let content = await readFile(
          resolve(__dirname, 'client/background.js'),
          'utf8'
        )
        this.manifestContent.background = {
          service_worker: this.serviceWorkerDevPath
        }
        context.emitFile({
          type: 'asset',
          source: code + content,
          fileName: this.serviceWorkerDevPath
        })
      }

      if (this.manifestContent.content_scripts) {
        let content = await readFile(
          resolve(__dirname, 'client/content.js'),
          'utf8'
        )
        context.emitFile({
          type: 'asset',
          source: code + content,
          fileName: this.contentScriptDevPath
        })
        this.manifestContent.content_scripts = [
          ...this.manifestContent.content_scripts,
          {
            matches: ['<all_urls>'],
            js: [this.contentScriptDevPath]
          }
        ]
      }
    }
  }

  public async compileLess(context, originPath, fullPath) {
    const source = await readFile(fullPath, 'utf8')
    const output = await less.render(source, {
      paths: [resolve(this.srcDir, dirname(originPath))],
      compress: true
    })
    context.emitFile({
      type: 'asset',
      source: output.css,
      fileName: normalize(normalizeCssFilename(originPath))
    })
  }

  // icon & css
  public async emitAssets(context) {
    for (const path of this.assetPaths) {
      const assetPath = resolve(this.srcDir, path)
      context.addWatchFile(assetPath)
      if (assetPath.endsWith('.less')) {
        await this.compileLess(context, path, assetPath)
      } else {
        let content = await readFile(assetPath)
        context.emitFile({
          type: 'asset',
          source: content,
          fileName: normalize(path)
        })
      }
    }
  }
}
