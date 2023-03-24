import { PluginContext } from 'rollup'
import {
  normalizeJsFilename,
  normalizeCssFilename,
  normalizePathResolve
} from '../utils'
import { emitAsset } from './asset'

const dynamicImportAssetRex =
  /(?<=chrome.scripting.(insertCSS|removeCSS)\()[\s\S]*?(?=\))/gm
const dynamicImportScriptRex =
  /(?<=chrome.scripting.executeScript\()[\s\S]*?(?=\))/gm

export async function generageDynamicImportScript(
  context: PluginContext,
  manifestContext,
  code: string
): Promise<string> {
  let sources: string[] = []
  let content = code.replace(dynamicImportScriptRex, (match) =>
    match.replace(/(?<=(files:\[)?)["|'][\s\S]*?["|'](?=\]?)/gm, (fileStr) => {
      const filePath = fileStr.replace(/"|'/g, '').trim()
      sources.push(filePath)
      return `"${normalizeJsFilename(filePath)}"`
    })
  )
  for (const filePath of sources) {
    if (/\.(js|ts)$/.test(filePath)) {
      await manifestContext.doBuild(context, filePath)
    }
  }
  return content
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
    let fullPath = normalizePathResolve(manifestContext.srcDir, filePath)
    emitAsset(context, filePath, fullPath)
  }

  return content
}
