import { PluginContext } from 'rollup'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { CONTENT_SCRIPT_DEV_PATH, SERVICE_WORK_DEV_PATH } from '../constants'
import { normalizeJsFilename, normalizeCssFilename } from '../utils'
import { createRequire } from 'module'
import { emitAsset } from './asset'

const require = createRequire(import.meta.url)
const { rollup } = require('rollup')

const dynamicImportRex = /(?<=chrome.runtime.getURL\()[\s\S]*?(?=\))/gm

const doBuild = (context, manifestContext, filePath) => {
  console.log('filePath',filePath);
  
  rollup({
    context: 'globalThis',
    input: resolve(manifestContext.srcDir, filePath),
    plugins: manifestContext.plugins
  }).then(async (bundle) => {
    const { output } = await bundle.generate({
      entryFileNames: normalizeJsFilename(filePath)
    })
    const outputChunk = output[0]
    context.emitFile({
      type: 'asset',
      source: outputChunk.code,
      fileName: outputChunk.fileName
    })
  })
}

export async function generageDynamicImport(
  context: PluginContext,
  manifestContext,
  code: string
): Promise<string> {
  let content =  code.replace(dynamicImportRex, (filePath) => {
    filePath = filePath.replace(/"|'/g, '').trim()
    let normalizePath = normalizeJsFilename(normalizeCssFilename(filePath))
    const fileFullPath = resolve(manifestContext.srcDir, filePath)
    context.addWatchFile(fileFullPath)
    if (!manifestContext.cache[filePath]) {
      if (/\.(js|ts)$/.test(filePath)) {
        doBuild(context, manifestContext, filePath)
      } else {
        if (!filePath.endsWith('.html')) {
          emitAsset(context, manifestContext.srcDir, filePath)
        }
      }
      manifestContext.cache[filePath] = true
    }
    return `"${normalizePath}"`
  })
  return content
}

// scripts for dev
export async function emitDevScript(
  context: PluginContext,
  manifestContext
): Promise<Record<string, any>> {
  let { viteConfig, port } = manifestContext.options
  let manifest = manifestContext.manifest
  let serviceWorkerPath = manifestContext.serviceWorkerAbsolutePath
  let contentScripts = manifest?.content_scripts

  if (viteConfig.mode === 'production') return manifest
  if (!serviceWorkerPath && contentScripts?.length) {
    let content = readFileSync(
      resolve(__dirname, 'client/background.js'),
      'utf8'
    )
    manifest.background = {
      service_worker: SERVICE_WORK_DEV_PATH
    }
    context.emitFile({
      type: 'asset',
      source: content,
      fileName: SERVICE_WORK_DEV_PATH
    })
  }
  if (!manifestContext.manifest.content_scripts) {
    manifest.content_scripts = []
  }
  if (serviceWorkerPath || contentScripts?.length) {
    let code = `var PORT=${port},MENIFEST_NAME='${manifest.name}';`
    let content = readFileSync(resolve(__dirname, 'client/content.js'), 'utf8')
    context.emitFile({
      type: 'asset',
      source: code + content,
      fileName: CONTENT_SCRIPT_DEV_PATH
    })
    manifest.content_scripts = [
      ...manifest.content_scripts,
      {
        matches: ['<all_urls>'],
        js: [CONTENT_SCRIPT_DEV_PATH]
      }
    ]
  }

  return manifest
}
