import { PluginContext } from 'rollup'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { CONTENT_SCRIPT_DEV_PATH, SERVICE_WORK_DEV_PATH } from '../constants'

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
