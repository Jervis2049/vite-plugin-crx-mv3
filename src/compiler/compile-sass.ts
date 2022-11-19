import { PluginContext } from 'rollup'
import { normalize } from 'path'
import { createRequire } from 'module'
import { normalizeCssFilename } from '../utils'

const require = createRequire(import.meta.url)

// allow to import from node_modules
// @import "~package-name/var.scss"
const tildeImporter = (url: string) => {
  if (url.includes('~')) {
    url = url.replace('~', '')

    if (!url.includes('.scss')) {
      url += '.scss'
    }

    url = require.resolve(url)
  }
  return { file: url }
}

export async function compileSass(
  context: PluginContext,
  originalPath: string,
  fullPath: string
) {
  const { renderSync } = require('sass')
  const { css } = renderSync({ file: fullPath, importer: tildeImporter })

  context.emitFile({
    type: 'asset',
    source: css,
    fileName: normalize(normalizeCssFilename(originalPath))
  })
}
