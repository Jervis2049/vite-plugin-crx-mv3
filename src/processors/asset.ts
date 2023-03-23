import { PluginContext } from 'rollup'
import { normalize } from 'path'
import { readFile } from 'node:fs/promises'
import { compileSass } from '../compiler/compile-sass'
import { compileLess } from '../compiler/compile-less'
import { getContentFromCache } from '../utils'

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
    let content = await getContentFromCache(
      context,
      fullPath,
      readFile(fullPath)
    )
    context.emitFile({
      type: 'asset',
      source: content,
      fileName: normalize(originalPath)
    })
  }
}
