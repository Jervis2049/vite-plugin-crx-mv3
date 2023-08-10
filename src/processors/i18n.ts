// import { PluginContext } from 'rollup'
import { readdir, stat } from 'fs/promises'
import path from 'path'
import fs from 'fs'
import { emitAsset } from './asset'
import { normalizePath } from '../utils'

async function getAllFilePaths(directoryPath) {
  try {
    const files = await readdir(directoryPath)
    const filePaths: string[] = []

    for (const file of files) {
      const filePath: string = path.join(directoryPath, file)
      const fileStats = await stat(filePath)

      if (fileStats.isFile()) {
        filePaths.push(filePath)
      } else if (fileStats.isDirectory()) {
        const subDirFilePaths = await getAllFilePaths(filePath)
        filePaths.push(...subDirFilePaths)
      }
    }
    return filePaths
  } catch (err) {
    throw err
  }
}

export async function generateLocales(context, srcPath: string) {
  let localesDir = path.join(srcPath, '_locales')
  if (fs.existsSync(localesDir)) {
    const fileFullPaths = await getAllFilePaths(localesDir)
    for (const fileFullPath of fileFullPaths) {
      context.addWatchFile(fileFullPath)
      const relativePath = path.relative(srcPath, fileFullPath)
      emitAsset(context, relativePath, normalizePath(fileFullPath))
    }
  }
}
