import os from 'os'
import { dirname, join, resolve, posix } from 'path'
import { access, writeFile, mkdir } from 'node:fs/promises'
import { PluginCache } from 'rollup'

export function isJsonString(str: string) {
  try {
    return !!(JSON.parse(str) && str)
  } catch (e) {
    return false
  }
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function normalizePath(id: string): string {
  return posix.normalize(os.platform() === 'win32' ? slash(id) : id)
}

export function normalizePathResolve(p1: string, p2: string) {
  return normalizePath(resolve(p1, p2))
}

export const normalizeJsFilename = (p: string) => p.replace(/\.[tj]sx?/, '.js')

export const normalizeCssFilename = (p: string) =>
  p.replace(/\.(less|scss)/, '.css')

export function relaceCssUrlPrefix(code: string) {
  return code.replace(/(?<=url\()[\s\S]*?(?=\))/gm, function (str) {
    return (
      'chrome-extension://' + slash(join('__MSG_@@extension_id__', str.trim()))
    )
  })
}

export function relaceResourcePathPrefix(code: string) {
  return code.replace(
    /(?<=(=))"[^(?!")]+(\.png|jpg|jpeg|svg|webp|gif|mp3|mp4|avi|rmvb|mpeg|ra|ram|mov|wmv|pdf)"(?=,|;)/gm,
    function (str) {
      return str.startsWith('http') ? str : `chrome.runtime.getURL(${str})`
    }
  )
}

export function convertIntoIIFE(code: string) {
  return `;(function(){${code}})()`
}

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export const isString = (value: unknown): value is string =>
  typeof value === 'string'

export async function emitFile(path: string, content: string) {
  try {
    let dirName = dirname(path)
    const isDirExist = await access(dirName)
      .then(() => true)
      .catch(() => false)

    if (!isDirExist) {
      await mkdir(dirName)
      await emitFile(path, content)
    } else {
      await writeFile(path, content)
    }
  } catch (error) {
    console.log(error)
  }
}

export async function getContentFromCache<T>(
  cache: PluginCache,
  id: string,
  getContentAsyncFun: Promise<T>
): Promise<T> {
  let content
  if (!cache.has(id)) {
    content = await getContentAsyncFun
    cache.set(id, content)
  } else {
    content = cache.get(id)
    // console.log('cache:', id)
  }
  return content
}
