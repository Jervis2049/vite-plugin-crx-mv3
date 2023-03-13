import type { Plugin, ResolvedConfig } from 'vite'
import type { Processor } from './manifest'
import { WebSocketServer } from 'ws'
import { resolve, dirname, extname, basename } from 'path'
import { normalizePath, normalizePathResolve, isObject } from './utils'
import { loadManifest, ManifestProcessor } from './processors/manifest'
import { httpServerStart } from './http'
import { VITE_PLUGIN_CRX_MV3, UPDATE_CONTENT, stubId } from './constants'
import type { ChromeExtensionManifest } from './manifest'

interface Options {
  port?: number
  manifest: string
}

export default function crxMV3(options: Partial<Options> = {}): Plugin {
  let { port = 8181, manifest = '' } = options

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
  let changedFilePath = ''
  let manifestAbsolutPath: string
  let manifestProcessor: Processor
  let srcDir = dirname(manifest)
  let config: ResolvedConfig

  async function websocketServerStart(manifest: ChromeExtensionManifest) {
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
      if (request.url === `/${manifest.name}/crx`) {
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
      let manifestContent: ChromeExtensionManifest =
        loadManifest(manifestAbsolutPath)
      // websocket service
      await websocketServerStart(manifestContent)

      manifestProcessor = new ManifestProcessor({
        port,
        srcDir,
        manifest: manifestContent,
        viteConfig: config
      })
    },
    options({ input, ...options }) {
      manifestProcessor.reloadManifest(manifestAbsolutPath)
      let htmlPaths = manifestProcessor.getHtmlPaths()
      let finalInput = input
      let buildInput = config.build.rollupOptions.input

      if (!buildInput && !htmlPaths.length) {
        finalInput = stubId
      } else {
        if (Array.isArray(buildInput)) {
          finalInput = [...buildInput, ...htmlPaths]
        } else if (isObject(buildInput)) {
          const entryObj = {}
          for (const item of htmlPaths) {
            const name = basename(item, extname(item))
            entryObj[name] = resolve(srcDir, item)
          }
          finalInput = { ...buildInput, ...entryObj }
        } else {
          finalInput = [
            buildInput && typeof buildInput === 'string' ? buildInput: stubId,
            ...htmlPaths
          ]
        }
      }
      
      return { input: finalInput, ...options }
    },
    watchChange(id) {
      changedFilePath = normalizePath(id)
      console.log(`\x1B[35mFile change detected :\x1B[0m ${changedFilePath}`)
    },
    async buildStart() {
      this.addWatchFile(manifestAbsolutPath)
      await manifestProcessor.generateServiceWorkScript(this)
      await manifestProcessor.generateAsset(this)
      await manifestProcessor.generateContentScript(this)
      await manifestProcessor.generateWebAccessibleResources(this)
      manifestProcessor.generateManifest(this)
    },
    resolveId(source) {
      if (source === stubId) return stubId
      return null
    },
    load(id) {
      if (id === stubId) return `console.log('stub')`
      return null
    },
    generateBundle(options, bundle) {
      for (const [key, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.facadeModuleId === stubId) {
          delete bundle[key]
          break
        }
      }
    },
    writeBundle() {
      if (socket) {
        const assetPaths = manifestProcessor.assetPaths.map((path) => {
          return normalizePathResolve(srcDir, path)
        })
        if (
          manifestProcessor.contentScriptPaths.includes(changedFilePath) ||
          assetPaths.includes(changedFilePath) ||
          changedFilePath === manifestProcessor.serviceWorkerAbsolutePath ||
          changedFilePath === manifestAbsolutPath
        ) {
          socket.send(UPDATE_CONTENT)
        }
      }
    }
  }
}
