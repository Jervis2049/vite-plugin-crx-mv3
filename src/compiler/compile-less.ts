import { PluginContext } from 'rollup'
import { readFileSync } from 'fs'
import { normalize } from 'path'
import { normalizeCssFilename } from '../utils'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export async function compileLess(
  context: PluginContext,
  originalPath: string,
  fullPath: string
) {
  const less = require('less')
  const source = readFileSync(fullPath, 'utf8')
  const { css } = await less.render(source, {
    paths: [process.cwd()],
    compress: true
  })

  context.emitFile({
    type: 'asset',
    source: css,
    fileName: normalize(normalizeCssFilename(originalPath))
  })
}
