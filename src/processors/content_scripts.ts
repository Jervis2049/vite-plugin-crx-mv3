import { PluginContext } from 'rollup'
import { ChunkMetadata } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import {
  relaceCssUrlPrefix,
  relaceResourcePathPrefix,
  convertIntoIIFE
} from '../utils'
import { CONTENT_SCRIPT_DEV_PATH, SERVICE_WORK_DEV_PATH } from '../constants'

declare module 'rollup' {
  export interface RenderedChunk {
    viteMetadata: ChunkMetadata
  }
}

// generate content_scripts
export async function generageContentScripts(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
  const { rollup } = await import('rollup')
  for (const script of manifestContext.manifestContent.content_scripts || []) {
    for (const js of script.js || []) {
      const bundle = await rollup({
        input: resolve(manifestContext.srcDir, js),
        plugins: manifestContext.plugins
      })
      try {
        const { output } = await bundle.generate({
          entryFileNames: 'content-scripts/[name].js'
          // format: "iife"
        })
        bundle.watchFiles.forEach((path) => {
          context.addWatchFile(path)
        })
        const outputChunk = output[0]
        if (outputChunk.type === 'chunk') {
          const viteMetadata = outputChunk.viteMetadata
          const importedCss = [...viteMetadata.importedCss]
          const importedAssets = [...viteMetadata.importedAssets]
          const cssSource = output.filter((x) =>
            importedCss.includes(x.fileName)
          )
          const assetsSource = output.filter((item) =>
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
              ? convertIntoIIFE(relaceResourcePathPrefix(x.code))
              : relaceCssUrlPrefix(x.source)
            context.emitFile({
              type: 'asset',
              source: content,
              fileName: x.fileName
            })
          })
        }
      } finally {
        await bundle.close()
      }
    }
  }
  return manifestContext.manifestContent
}

// generate scripts for dev
export async function generateScriptForDev(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
  let { viteConfig, port } = manifestContext.options
  if (viteConfig.mode === 'production') return manifestContext.manifestContent
  let code = `var PORT=${port};`
  if (!manifestContext.serviceWorkerPath) {
    let content = readFileSync(
      resolve(__dirname, 'client/background.js'),
      'utf8'
    )
    manifestContext.manifestContent.background = {
      service_worker: SERVICE_WORK_DEV_PATH
    }
    context.emitFile({
      type: 'asset',
      source: code + content,
      fileName: SERVICE_WORK_DEV_PATH
    })
  }

  if (!manifestContext.manifestContent.content_scripts) {
    manifestContext.manifestContent.content_scripts = []
  }
  let content = readFileSync(resolve(__dirname, 'client/content.js'), 'utf8')
  context.emitFile({
    type: 'asset',
    source: code + content,
    fileName: CONTENT_SCRIPT_DEV_PATH
  })
  manifestContext.manifestContent.content_scripts = [
    ...manifestContext.manifestContent.content_scripts,
    {
      matches: ['<all_urls>'],
      js: [CONTENT_SCRIPT_DEV_PATH]
    }
  ]
  return manifestContext.manifestContent
}
