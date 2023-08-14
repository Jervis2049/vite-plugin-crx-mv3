import type { Plugin, ResolvedConfig } from 'vite'
import { OutputAsset, OutputChunk } from 'rollup'
import type { Processor } from './manifest'
import { WebSocketServer } from 'ws'
import { resolve, dirname, extname, basename, join } from 'path'
import {
  normalizePath,
  normalizePathResolve,
  isObject,
  isString,
  relaceCssUrlPrefix,
  relaceResourcePathPrefix
} from './utils'
import { ManifestProcessor } from './processors/manifest'
import { generateLocales } from './processors/i18n'
import { httpServerStart } from './http'
import { VITE_PLUGIN_CRX_MV3, UPDATE_CONTENT, stubId } from './constants'

interface Options {
  port?: number
  manifest: string
  reloadPage?: boolean
}

export default function crxMV3(options: Partial<Options> = {}): Plugin {
  let { port = 8181, manifest = '', reloadPage = true } = options

  if (
    !manifest ||
    typeof manifest != 'string' ||
    (typeof manifest == 'string' && !manifest.endsWith('manifest.json'))
  ) {
    throw new Error(
      "The manifest parameter is required and the value must be the path to the chrome extension's manifest.json."
    )
  }

  let socket
  let changedFilePath: string
  let manifestAbsolutPath: string
  let manifestProcessor: Processor
  let srcDir: string = dirname(manifest)
  let config: ResolvedConfig
  let popupAbsolutePath: string
  let popupMoudles: string[] = []

  async function websocketServerStart(manifest) {
    if (
      config.mode === 'production' ||
      (!manifest?.background?.service_worker &&
        !manifest?.content_scripts?.length)
    ) {
      return
    }
    const serverOptions = await httpServerStart(port)
    const server = serverOptions.server
    port = serverOptions.port
    const wss = new WebSocketServer({ noServer: true })

    wss.on('connection', function connection(ws) {
      console.log(`\x1B[32m[${VITE_PLUGIN_CRX_MV3}]\x1B[0m client connected.`)
      ws.on('message', () => {
        ws.send('keep websocket alive.')
      })
      ws.on('close', () => {
        console.log(
          `\x1B[32m[${VITE_PLUGIN_CRX_MV3}]\x1B[0m client disconnected.`
        )
      })
      socket = ws
    })
    server.on('upgrade', function upgrade(request, socket, head) {
      if (request.url === `/${encodeURI(manifest.name)}/crx`) {
        wss.handleUpgrade(request, socket, head, function done(ws) {
          wss.emit('connection', ws, request)
        })
      } else {
        socket.destroy()
      }
    })
  }

  return {
    name: VITE_PLUGIN_CRX_MV3,
    apply: 'build',
    async configResolved(_config: ResolvedConfig) {
      config = _config
      manifestAbsolutPath = normalizePathResolve(config.root, manifest)
      manifestProcessor = new ManifestProcessor({
        manifestPath: manifest,
        viteConfig: config
      })
      await manifestProcessor.loadManifest(manifestAbsolutPath)
      // websocket service
      await websocketServerStart(manifestProcessor.manifest)

      let defaultPopupPath = manifestProcessor.manifest.action?.default_popup
      if (defaultPopupPath) {
        popupAbsolutePath = normalizePathResolve(srcDir, defaultPopupPath)
      }
    },
    async options({ input, ...options }) {
      await manifestProcessor.reLoadManifest(manifestAbsolutPath)
      let htmlPaths = manifestProcessor.getHtmlPaths()
      let contentScriptPaths = manifestProcessor.getContentScriptPaths()
      let buildInput = config.build.rollupOptions.input
      let finalInput = input
      let serviceWorkerPath = manifestProcessor.serviceWorkerAbsolutePath
        ? [manifestProcessor.serviceWorkerAbsolutePath]
        : []

      if (Array.isArray(buildInput)) {
        finalInput = [
          ...buildInput,
          ...htmlPaths,
          ...contentScriptPaths,
          ...serviceWorkerPath,
          stubId
        ]
      } else if (isObject(buildInput)) {
        const entryObj = { stub: stubId }
        for (const item of [
          ...htmlPaths,
          ...contentScriptPaths,
          ...serviceWorkerPath
        ]) {
          const name = basename(item, extname(item))
          entryObj[name] = resolve(srcDir, item)
        }
        finalInput = { ...buildInput, ...entryObj }
      } else {
        finalInput = [
          buildInput && isString(buildInput) ? buildInput : stubId,
          ...htmlPaths,
          ...contentScriptPaths,
          ...serviceWorkerPath
        ]
      }
      return { input: finalInput, ...options }
    },
    watchChange(id) {
      changedFilePath = normalizePath(id)
      manifestProcessor.clearCacheById(this, changedFilePath)
      console.log(`\x1B[35mFile change detected :\x1B[0m ${changedFilePath}`)
    },
    async buildStart() {
      this.addWatchFile(manifestAbsolutPath)
      await manifestProcessor.generateDevScript(this, port, reloadPage)
      await manifestProcessor.generateAsset(this)
      await generateLocales(this, join(config.root, srcDir))
    },
    transform(code, id) {
      return manifestProcessor.transform(code, id, this)
    },
    resolveId(source) {
      if (source === stubId) return stubId
      return null
    },
    load(id) {
      if (id === stubId) return `console.log('stub')`
      return null
    },
    async generateBundle(options, bundle) {
      // console.log('bundle', bundle)
      let bundleMap = {}
      let contentScriptPaths = manifestProcessor.getContentScriptPaths()
      let contentScriptImportedCss: string[] = []

      for (const [key, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.facadeModuleId) {
          if (chunk.facadeModuleId === stubId) {
            delete bundle[key]
          } else if (chunk.facadeModuleId === popupAbsolutePath) {
            popupMoudles = Object.keys(chunk.modules)
          } else {
            bundleMap[chunk.facadeModuleId] = chunk
            if (contentScriptPaths.includes(chunk.facadeModuleId)) {
              let output = bundle[key] as OutputChunk
              output.code = relaceResourcePathPrefix(output.code)
              contentScriptImportedCss = [
                ...contentScriptImportedCss,
                ...output.viteMetadata.importedCss
              ]
            }
          }
        }
      }
      for (const fileName of contentScriptImportedCss) {
        let output = bundle[fileName] as OutputAsset
        output.source = isString(output.source)
          ? relaceCssUrlPrefix(output.source)
          : ''
      }
      await manifestProcessor.generateManifest(this, bundle, bundleMap)
    },
    writeBundle() {
      if (socket) {
        if (!popupMoudles.includes(changedFilePath)) {
          socket.send(UPDATE_CONTENT)
        }
      }
    }
  }
}
