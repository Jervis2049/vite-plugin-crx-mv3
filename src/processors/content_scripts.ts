import { PluginContext, OutputAsset } from 'rollup'
import { ChunkMetadata } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import {
  normalizeJsFilename,
  normalizeCssFilename,
  relaceCssUrlPrefix,
  relaceResourcePathPrefix,
  convertIntoIIFE,
  isString
} from '../utils'
import { CONTENT_SCRIPT_DEV_PATH, SERVICE_WORK_DEV_PATH } from '../constants'

declare module 'rollup' {
  export interface RenderedChunk {
    viteMetadata: ChunkMetadata
  }
}

// generate content_scripts
export async function emitContentScripts(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
 
  const { rollup } = await import('rollup')
  let contentScriptPaths: string[] = []
  for (const script of manifestContext.manifest.content_scripts ?? []) {
    for (const [index, css] of (script.css ?? []).entries()) {
      script.css[index] = normalizeCssFilename(css)
    }
    for (const [index, js] of (script.js ?? []).entries()) {
      const bundle = await rollup({
        context: 'globalThis',
        input: resolve(manifestContext.srcDir, js),
        plugins: manifestContext.plugins,
      })
      script.js[index] = normalizeJsFilename(js)
      try {
        const { output } = await bundle.generate({
          entryFileNames: normalizeJsFilename(js)
          // format: "iife"
        })

        contentScriptPaths = [
          ...contentScriptPaths,
          ...bundle.watchFiles.filter((p) => !p.includes('node_modules'))
        ]

        bundle.watchFiles.forEach((p) => {
          if(!context.getWatchFiles().includes(p)){
            context.addWatchFile(p)
          }
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
          context.emitFile({
            type: 'asset',
            source: convertIntoIIFE(relaceResourcePathPrefix(outputChunk.code)),
            fileName: outputChunk.fileName
          })
          ;[...cssSource, ...assetsSource].map((x) => {
            let source = (x as OutputAsset).source
            context.emitFile({
              type: 'asset',
              source: isString(source) ? relaceCssUrlPrefix(source):  source,
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
    manifest: manifestContext.manifest,
    contentScriptPaths
  }
}

// scripts for dev
export async function emitDevScript(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
  let { viteConfig, port } = manifestContext.options
  let manifest = manifestContext.manifest
  let serviceWorkerPath = manifestContext.serviceWorkerAbsolutePath
  let contentScripts = manifest?.content_scripts

  if (viteConfig.mode === 'production') return manifest
  if (!serviceWorkerPath && contentScripts?.length) {
    let content = readFileSync(
      resolve(__dirname, 'client/background.js'),
      'utf8'
    )
    manifest.background = {
      service_worker: SERVICE_WORK_DEV_PATH
    }
    context.emitFile({
      type: 'asset',
      source: content,
      fileName: SERVICE_WORK_DEV_PATH
    })
  }
  if (!manifestContext.manifest.content_scripts) {
    manifest.content_scripts = []
  }
  if (serviceWorkerPath || contentScripts?.length) {
    let code = `var PORT=${port},MENIFEST_NAME='${manifest.name}';`
    let content = readFileSync(resolve(__dirname, 'client/content.js'), 'utf8')
    context.emitFile({
      type: 'asset',
      source: code + content,
      fileName: CONTENT_SCRIPT_DEV_PATH
    })
    manifest.content_scripts = [
      ...manifest.content_scripts,
      {
        matches: ['<all_urls>'],
        js: [CONTENT_SCRIPT_DEV_PATH]
      }
    ]
  }

  return manifest
}
