import { registerAppIPC } from './app'
import { registerWindowIPC } from './window'

export function registerAllIPC(): void {
  registerAppIPC()
  registerWindowIPC()
  // Future phases add: registerArtifactIPC(), registerFSIPC(), etc.
}
