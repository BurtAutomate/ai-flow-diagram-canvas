import { ipcMain, app } from 'electron'
import { AppQuitSchema } from '../../shared/validators/app'
import { IPC_CHANNELS } from '../../shared/types/ipc'

export function registerAppIPC(): void {
  ipcMain.handle(IPC_CHANNELS.APP_QUIT, async (_event, payload) => {
    const params = AppQuitSchema.parse(payload)
    try {
      if (params.force) {
        app.exit(0)
      } else {
        app.quit()
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, async () => {
    return app.getVersion()
  })
}
