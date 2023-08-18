import { PluginContext } from 'rollup'
import {
  normalizeJsFilename,
  normalizeCssFilename,
  normalizePathResolve
} from '../utils'
import { emitAsset } from './asset'

const fileContentRex = /(?<=['"`])(.*?)(?=['"`])/g
const chromeScriptingRex =
  /chrome\s*\.\s*scripting\s*\.\s*(executeScript|insertCSS|removeCSS|registerContentScripts)\s*\(\s*([\s\S]*?)\s*\)/g

export async function generageDynamicImports(
  context: PluginContext,
  manifestContext,
  code: string
): Promise<string> {
  let files: string[] = []
  let modifiedCode = code.replace(chromeScriptingRex, (match) => {
    let fileMatches = match.match(fileContentRex)
    if (Array.isArray(fileMatches)) {
      files = [...files, ...fileMatches]
    }
    return match.replace(fileContentRex, (filePath) => {
      if (filePath.endsWith('.ts')) {
        return normalizeJsFilename(filePath)
      } else if (/\.(less|scss)$/.test(filePath)) {
        return normalizeCssFilename(filePath)
      } else {
        return filePath
      }
    })
  })
  let uniqueFiles = [...new Set(files)]
  for (const filePath of uniqueFiles) {
    if (/\.(js|ts)$/.test(filePath)) {
      await manifestContext.doBuild(context, filePath)
    }
    if (/\.(css|less|scss)$/.test(filePath)) {
      let fullPath = normalizePathResolve(manifestContext.srcDir, filePath)
      emitAsset(context, filePath, fullPath)
    }
  }
  return modifiedCode
}
