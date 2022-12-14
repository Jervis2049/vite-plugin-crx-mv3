import { PluginContext } from 'rollup'
import { resolve, normalize } from 'path'
import { readFileSync } from 'fs'
import { compileSass } from '../compiler/compile-sass'
import { compileLess } from '../compiler/compile-less'

export async function emitAsset(
  context: PluginContext,
  srcDir: string,
  path: string
): Promise<void> {
  const assetPath = resolve(srcDir, path)
  context.addWatchFile(assetPath)
  if (assetPath.endsWith('.less')) {
    await compileLess(context, path, assetPath)
  } else if (assetPath.endsWith('.scss')) {
    await compileSass(context, path, assetPath)
  } else {
    let content = readFileSync(assetPath)
    context.emitFile({
      type: 'asset',
      source: content,
      fileName: normalize(path)
    })
  }
}
