import { useEffect, useState } from 'react'

export { type ElectronAPI } from '../../../shared/types/window'

export function useElectronAPI() {
  return (window as Window).electronAPI
}

export function useAppVersion() {
  const api = useElectronAPI()
  const [version, setVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.app.getVersion()
      .then(setVersion)
      .catch((err: Error) => setError(err.message))
  }, [api])

  return { version, error }
}
