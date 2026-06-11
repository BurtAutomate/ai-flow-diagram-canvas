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
