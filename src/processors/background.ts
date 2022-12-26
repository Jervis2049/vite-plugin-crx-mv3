import { PluginContext } from 'rollup'
import { createRequire } from 'module'
import { normalizeJsFilename, normalizeCssFilename } from '../utils'
import { emitAsset } from './asset'
import { resolve } from 'path'

const require = createRequire(import.meta.url)

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
      const { rollup } = require('rollup')
      const outDir = manifestContext.options.viteConfig.build.outDir
      const filePath = fileStr.replace(/"|'/g, '').trim()
      const fileFullPath = resolve(manifestContext.srcDir, filePath)
      const normalizePath = normalizeJsFilename(filePath)
      context.addWatchFile(fileFullPath)
      rollup({
        input: fileFullPath,
        plugins: manifestContext.plugins
      }).then(async (bundle) => {
        await bundle.write({
          file: `${outDir}/${normalizePath}`
        })
      })
      return `"${normalizePath}"`
    })
  )
}

export async function generageDynamicImportAsset(
  context: PluginContext,
  srcDir: string,
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
    emitAsset(context, srcDir, filePath)
  }

  return content
}
