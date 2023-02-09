import { PluginContext } from 'rollup'
import { createRequire } from 'module'
import { normalizeJsFilename, normalizeCssFilename } from '../utils'
import { emitAsset } from './asset'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const require = createRequire(import.meta.url)

const dynamicImportAssetRex =
  /(?<=chrome.scripting.(insertCSS|removeCSS)\()[\s\S]*?(?=\))/gm
const dynamicImportScriptRex =
  /(?<=chrome.scripting.executeScript\()[\s\S]*?(?=\))/gm

async function generageDynamicImportScript(
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
        context: 'globalThis',
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

async function generageDynamicImportAsset(
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

export async function emitServiceWorkScript(
  context: PluginContext,
  manifestContext,
) {
  const { rollup } = await import('rollup')  
  const bundle = await rollup({
    input: manifestContext.serviceWorkerAbsolutePath,
    plugins: manifestContext.plugins
  })
  try {
    const { output } = await bundle.generate({})
    let code =  output[0].code + readFileSync(resolve(__dirname, 'client/background.js'), 'utf8')
    let source = await generageDynamicImportScript(context, manifestContext, code)
    source = await generageDynamicImportAsset(context, manifestContext, source)
    context.emitFile({
      type: 'asset',
      source,
      fileName: output[0].fileName
    })

  } finally {
    await bundle.close()
  }
}
