import { PluginContext } from 'rollup'
import { resolve } from 'path'
import { emitAsset } from './asset'
import { normalizeJsFilename, normalizeCssFilename } from '../utils'

export async function emitWebAccessibleResources(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
  const { rollup } = await import('rollup')
  let resourcePaths: string[] = []
  
  for (const item of manifestContext.manifest.web_accessible_resources ?? []) {
    for (const [index, path] of (item.resources ?? []).entries()) {
      if (path.includes('*')) continue
      if (path.endsWith('.html')) continue
      if (/\.(js|ts)$/.test(path)) {
        const bundle = await rollup({
          context: 'globalThis',
          input: resolve(manifestContext.srcDir, path),
          plugins: manifestContext.plugins
        })
        try {
          const { output } = await bundle.generate({
            entryFileNames: normalizeJsFilename(path),
            format: 'iife'
          })
          resourcePaths = [
            ...resourcePaths,
            ...bundle.watchFiles.filter((p) => !p.includes('node_modules'))
          ]  
          bundle.watchFiles.forEach((p) => {
            if (!context.getWatchFiles().includes(p)) {
              context.addWatchFile(p)
            }
          })
          const outputChunk = output[0]
          if (outputChunk.type === 'chunk') {
            context.emitFile({
              type: 'asset',
              source: outputChunk.code,
              fileName: outputChunk.fileName
            })
          }
          item.resources[index] = normalizeJsFilename(path)
        } finally {
          await bundle.close()
        }
      } else {
        if(!manifestContext.assetPaths.includes(path)){     
          emitAsset(context, manifestContext.srcDir, path)
          item.resources[index] = normalizeCssFilename(path)
        }
      }
    }
  }
  
  return {
    manifest: manifestContext.manifest,
    resourcePaths
  }
}
