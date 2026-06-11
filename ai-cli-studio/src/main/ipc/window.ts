import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/types/ipc'

function getFocusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow()
}

export function registerWindowIPC(): void {
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async () => {
    getFocusedWindow()?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async () => {
    const win = getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async () => {
    getFocusedWindow()?.close()
  })
}
