import { readFileSync } from 'fs'
import { normalize } from 'path'
import { normalizeCssFilename } from '../utils'

export async function compileLess(context, originPath, fullPath) {
  const less = (await import('less')).default
  const source = readFileSync(fullPath, 'utf8')
  const output = await less.render(source, {
    paths: [process.cwd()],
    compress: true
  })
  context.emitFile({
    type: 'asset',
    source: output.css,
    fileName: normalize(normalizeCssFilename(originPath))
  })
}
