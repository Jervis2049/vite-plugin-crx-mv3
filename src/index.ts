import type { Plugin, ResolvedConfig } from 'vite'
import { WebSocketServer } from 'ws'
import { resolve, dirname, extname, basename } from 'path'
import { normalizePath, normalizePathResolve } from './utils'
import { ManifestProcessor } from './processors/manifest'
import { httpServerStart } from './http'
import {
  VITE_PLUGIN_CRX_MV3,
  UPDATE_CONTENT,
  UPDATE_SERVICE_WORK
} from './constants'

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

  let socket: any
  let manifestPath: string | undefined
  let changedFilePath: string
  let manifestProcessor
  let srcDir = dirname(manifest)

  function setRollupInput(config, entries) {
    let rollupOptionsInput = config.build.rollupOptions.input
    if (Array.isArray(rollupOptionsInput)) {
      config.build.rollupOptions.input = [...rollupOptionsInput, ...entries]
    } else if (typeof rollupOptionsInput === 'object') {
      const entryObj = {}
      entries.forEach((item) => {
        const name = basename(item, extname(item))
        entryObj[name] = resolve(srcDir, item)
      })
      config.build.rollupOptions.input = {
        ...rollupOptionsInput,
        ...entryObj
      }
    } else {
      config.build.rollupOptions.input = [
        ...(rollupOptionsInput ? [rollupOptionsInput] : []),
        ...entries
      ]
    }
  }

  function handleBuildPath(config) {
    if (!config.build.rollupOptions.output) {
      config.build.rollupOptions.output = {}
    }
    const entryFileNames = config.build.rollupOptions.output.entryFileNames
    config.build.rollupOptions.output.entryFileNames = (assetInfo) => {
      if (
        assetInfo.facadeModuleId &&
        /.(j|t)s$/.test(assetInfo.facadeModuleId)
      ) {
        const assetPath = dirname(assetInfo.facadeModuleId).replace(
          normalizePath(resolve(srcDir)),
          ''
        )
        return `${assetPath ? assetPath.slice(1) + '/' : ''}[name].js`
      }
      if (entryFileNames) {
        if (typeof entryFileNames == 'string') {
          return entryFileNames
        } else if (typeof entryFileNames == 'function') {
          return entryFileNames(assetInfo)
        }
      }
      return 'assets/[name]-[hash].js'
    }
  }

  async function websocketServerStart(config) {
    if (config.mode === 'production') return
    const serverOptions = await httpServerStart(port)
    const server = serverOptions.server
    port = serverOptions.port
    const wss = new WebSocketServer({ noServer: true })
    wss.on('connection', function connection(ws) {
      console.log(`\x1B[33m[${VITE_PLUGIN_CRX_MV3}]\x1B[0m client connected.`)
      ws.on('message', () => {
        ws.send('keep websocket alive.')
      })
      ws.on('close', () =>
        console.log(
          `\x1B[33m[${VITE_PLUGIN_CRX_MV3}]\x1B[0m client disconnected.`
        )
      )
      socket = ws
    })
    server.on('upgrade', function upgrade(request, socket, head) {
      if (request.url === '/crx') {
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
    enforce: 'pre',
    async configResolved(config: ResolvedConfig) {
      manifestPath = normalizePathResolve(config.root, manifest)
      manifestProcessor = new ManifestProcessor({
        manifestPath,
        port,
        viteConfig: config
      })
      let entries = await manifestProcessor.getAssetPaths()
      entries = entries.map((path) => resolve(srcDir, path))

      setRollupInput(config, entries)
      // Rewrite output.entryFileNames to modify build path of assets.
      handleBuildPath(config)
      // Open socket service
      websocketServerStart(config)
    },
    watchChange(id) {
      changedFilePath = normalizePath(id)
      console.log(`\x1B[35mFile change detected :\x1B[0m ${changedFilePath}`)
    },
    async buildStart() {
      await manifestProcessor.getAssetPaths()
      await manifestProcessor.generageContentScripts(this)
      await manifestProcessor.emitAssets(this)
      await manifestProcessor.emitScriptForDev(this)
    },
    transform(code, id) {
      return manifestProcessor.transform(code, id)
    },
    async generateBundle() {
      manifestProcessor.emitManifest(this)
    },
    writeBundle() {
      if (socket) {
        let manifestChanged = manifestPath === changedFilePath
        if (
          manifestProcessor.serviceWorkerPath === changedFilePath ||
          manifestChanged
        ) {
          socket.send(UPDATE_SERVICE_WORK)
        } else if (
          (changedFilePath && changedFilePath.includes('content-scripts')) ||
          manifestChanged
        ) {
          socket.send(UPDATE_CONTENT)
        }
      }
    }
  }
}
