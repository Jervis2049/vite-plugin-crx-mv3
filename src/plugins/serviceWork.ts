import { readFileSync } from 'fs'
import { resolve } from 'path'
import { normalizeJsFilename } from '../utils'

export function serviceWorkPlugin(
  serviceWorkerPath: string | undefined,
  port: number
) {
  return {
    name: 'crx:servicework',
    transform(code, id) {
      let data = ''
      if (serviceWorkerPath === id) {
        data = `var PORT=${port};`
        data += readFileSync(resolve(__dirname, 'client/background.js'), 'utf8')
      }
      if (code.indexOf('chrome.scripting.executeScript') > 0) {
        code = code.replace(
          /(?<=chrome.scripting.executeScript\()[\s\S]*?(?=\))/gm,
          function (fileStr) {
            return normalizeJsFilename(fileStr)
          }
        )
      }
      return data + code
    }
  }
}
