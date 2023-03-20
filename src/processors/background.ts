import { PluginContext } from 'rollup'
import { createRequire } from 'module'
import { normalizeJsFilename, normalizeCssFilename } from '../utils'
import { emitAsset } from './asset'
import { resolve } from 'path'

const require = createRequire(import.meta.url)
const { rollup } = require('rollup')
let cache

const dynamicImportAssetRex =
  /(?<=chrome.scripting.(insertCSS|removeCSS)\()[\s\S]*?(?=\))/gm
const dynamicImportScriptRex =
  /(?<=chrome.scripting.executeScript\()[\s\S]*?(?=\))/gm

export async function generageDynamicImportScript(
  context: PluginContext,
  manifestContext,
  code: string
): Promise<string> {
  return code.replace(dynamicImportScriptRex, (match) =>
    match.replace(/(?<=(files:\[)?)["|'][\s\S]*?["|'](?=\]?)/gm, (fileStr) => {
      const outDir = manifestContext.options.viteConfig.build.outDir
      const filePath = fileStr.replace(/"|'/g, '').trim()
      const fileFullPath = resolve(manifestContext.srcDir, filePath)
      const normalizePath = normalizeJsFilename(filePath)
      context.addWatchFile(fileFullPath)
      if (!manifestContext.cache[filePath]) {
        rollup({
          context: 'globalThis',
          input: fileFullPath,
          plugins: manifestContext.plugins,
          cache
        }).then(async (bundle) => {
          cache = bundle.cache
          await bundle.write({
            file: `${outDir}/${normalizePath}`
          })
        })
        manifestContext.cache[filePath] = true
      }
      return `"${normalizePath}"`
    })
  )
}

export async function generageDynamicImportAsset(
  context: PluginContext,
  manifestContext,
  code: string
): Promise<string> {
  let filePath = ''
  let content = code.replace(dynamicImportAssetRex, (match) =>
    match.replace(/(?<=(files:\[)?)["|'][\s\S]*?["|'](?=\]?)/gm, (fileStr) => {
      filePath = fileStr.replace(/"|'/g, '').trim()
      return `"${normalizeCssFilename(filePath)}"`
    })
  )
  if (filePath) {
    emitAsset(context, manifestContext.srcDir, filePath)
  }

  return content
}
