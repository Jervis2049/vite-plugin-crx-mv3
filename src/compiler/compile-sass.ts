import { normalize } from 'path'
import { normalizeCssFilename } from '../utils'

export async function compileSass(context, originPath, fullPath) {
    const { compile } = await import('sass')
    const {css}  = compile(fullPath);
    context.emitFile({
      type: 'asset',
      source: css,
      fileName: normalize(normalizeCssFilename(originPath))
    })
}
