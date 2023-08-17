import { PluginContext } from 'rollup'
import { normalize } from 'path'
import { compileSass } from '../compiler/compile-sass'
import { compileLess } from '../compiler/compile-less'
import { readFileSync } from 'fs'

export async function emitAsset(
  context: PluginContext,
  originalPath: string,
  fullPath: string
): Promise<void> {
  if (originalPath.endsWith('.less')) {
    await compileLess(context, originalPath, fullPath)
  } else if (originalPath.endsWith('.scss')) {
    await compileSass(context, originalPath, fullPath)
  } else {
    let content = readFileSync(fullPath)
    context.emitFile({
      type: 'asset',
      source: content,
      fileName: normalize(originalPath)
    })
  }
}
