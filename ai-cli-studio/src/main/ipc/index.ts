import { registerAppIPC } from './app'
import { registerWindowIPC } from './window'
import { registerFSIPC } from './fs'

export function registerAllIPC(): void {
  registerAppIPC()
  registerWindowIPC()
  registerFSIPC()
}
