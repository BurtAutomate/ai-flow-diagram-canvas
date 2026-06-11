export interface ElectronAPI {
  app: {
    quit: (force?: boolean) => Promise<void>
    getVersion: () => Promise<string>
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  fs: {
    listDir: (path: string) => Promise<FsDirEntry[]>
    readFile: (path: string) => Promise<string>
    getFileInfo: (path: string) => Promise<FsFileInfo>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

export interface FsDirEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

export interface FsFileInfo {
  size: number
  isDirectory: boolean
  isFile: boolean
  modifiedAt: number
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
