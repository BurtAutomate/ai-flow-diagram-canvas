import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  app: {
    quit: (force?: boolean) => ipcRenderer.invoke('app:quit', { force }),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  fs: {
    listDir: (path: string) => ipcRenderer.invoke('fs:listDir', { path }),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', { path }),
    getFileInfo: (path: string) => ipcRenderer.invoke('fs:getFileInfo', { path }),
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
