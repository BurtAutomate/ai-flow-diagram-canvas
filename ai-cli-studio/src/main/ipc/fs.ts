import { ipcMain } from 'electron'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { IPC_CHANNELS } from '../../shared/types/ipc'
import {
  FSListDirSchema,
  FSReadFileSchema,
  FSGetFileInfoSchema,
} from '../../shared/validators/fs'

function isBinaryFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase()
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico'].includes(ext ?? '')
}

export function registerFSIPC(): void {
  ipcMain.handle(IPC_CHANNELS.FS_LIST_DIR, async (_event, payload) => {
    const { path } = FSListDirSchema.parse(payload)
    const entries = await readdir(path, { withFileTypes: true })
    return entries.map((entry) => ({
      name: entry.name,
      path: join(path, entry.name),
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    }))
  })

  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE, async (_event, payload) => {
    const { path } = FSReadFileSchema.parse(payload)
    if (isBinaryFile(path)) {
      const buffer = await readFile(path)
      const ext = path.split('.').pop()?.toLowerCase() ?? 'png'
      const mime = ext === 'jpg' ? 'jpeg' : ext
      return `data:image/${mime};base64,${buffer.toString('base64')}`
    }
    return await readFile(path, 'utf-8')
  })

  ipcMain.handle(IPC_CHANNELS.FS_GET_FILE_INFO, async (_event, payload) => {
    const { path } = FSGetFileInfoSchema.parse(payload)
    const stats = await stat(path)
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      modifiedAt: stats.mtimeMs,
    }
  })
}
