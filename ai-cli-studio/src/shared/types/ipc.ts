export const IPC_CHANNELS = {
  APP_QUIT: 'app:quit',
  APP_GET_CWD: 'app:getCwd',
  APP_GET_VERSION: 'app:getVersion',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  FS_LIST_DIR: 'fs:listDir',
  FS_READ_FILE: 'fs:readFile',
  FS_GET_FILE_INFO: 'fs:getFileInfo',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
