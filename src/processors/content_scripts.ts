import { PluginContext } from 'rollup'
import { ChunkMetadata } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import {
  normalizeJsFilename,
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
  let contentScriptPaths: string[] = []
  for (const script of manifestContext.manifestContent.content_scripts || []) {
    for (const js of script.js || []) {
      const input = resolve(manifestContext.srcDir, js)
      const bundle = await rollup({
        input,
        plugins: manifestContext.plugins
      })
      try {
        const { output } = await bundle.generate({
          entryFileNames: normalizeJsFilename(js)
          // format: "iife"
        })

        contentScriptPaths = [
          ...contentScriptPaths,
          ...bundle.watchFiles.filter((p) => !p.includes('node_modules'))
        ]

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
          const assetsSource = output.filter((x) =>
            importedAssets.includes(x.fileName)
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
  return {
    manifestContent: manifestContext.manifestContent,
    contentScriptPaths
  }
}

// generate scripts for dev
export async function generateScriptForDev(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
  let { viteConfig, port } = manifestContext.options
  let manifestContent = manifestContext.manifestContent
  let serviceWorkerPath = manifestContext.serviceWorkerPath
  let contentScripts = manifestContent?.content_scripts

  if (viteConfig.mode === 'production') return manifestContent
  if (!serviceWorkerPath && contentScripts?.length) {
    let content = readFileSync(
      resolve(__dirname, 'client/background.js'),
      'utf8'
    )
    manifestContext.manifestContent.background = {
      service_worker: SERVICE_WORK_DEV_PATH
    }
    context.emitFile({
      type: 'asset',
      source: content,
      fileName: SERVICE_WORK_DEV_PATH
    })
  }
  if (!manifestContext.manifestContent.content_scripts) {
    manifestContext.manifestContent.content_scripts = []
  }
  if (serviceWorkerPath || contentScripts?.length) {
    let code = `var PORT=${port},MENIFEST_NAME='${manifestContent.name}';`
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
  }

  return manifestContext.manifestContent
}
