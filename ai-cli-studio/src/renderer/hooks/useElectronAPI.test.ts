import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Contract for the ElectronAPI interface that Plan 02 implements in preload/index.ts
interface ElectronAPI {
  app: {
    quit: (force?: boolean) => Promise<void>
    getVersion: () => Promise<string>
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

const mockAPI: ElectronAPI = {
  app: {
    quit: vi.fn().mockResolvedValue(undefined),
    getVersion: vi.fn().mockResolvedValue('1.0.0'),
  },
  window: {
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  },
  on: vi.fn().mockReturnValue(vi.fn()),
}

describe('useElectronAPI', () => {
  beforeEach(() => {
    vi.stubGlobal('electronAPI', mockAPI)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should have app namespace with quit and getVersion methods', () => {
    expect(window.electronAPI).toBeDefined()
    expect(window.electronAPI.app).toBeDefined()
    expect(typeof window.electronAPI.app.quit).toBe('function')
    expect(typeof window.electronAPI.app.getVersion).toBe('function')
  })

  it('should have window namespace with minimize, maximize, and close methods', () => {
    expect(window.electronAPI.window).toBeDefined()
    expect(typeof window.electronAPI.window.minimize).toBe('function')
    expect(typeof window.electronAPI.window.maximize).toBe('function')
    expect(typeof window.electronAPI.window.close).toBe('function')
  })

  it('should expose on method for event subscriptions', () => {
    expect(typeof window.electronAPI.on).toBe('function')
  })

  it('on should return a cleanup function', () => {
    const cleanup = window.electronAPI.on('test', () => {})
    expect(typeof cleanup).toBe('function')
  })

  it('app.getVersion should return a promise resolving to a version string', async () => {
    const version = await window.electronAPI.app.getVersion()
    expect(typeof version).toBe('string')
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('app.quit should accept an optional force parameter', async () => {
    await window.electronAPI.app.quit(true)
    expect(mockAPI.app.quit).toHaveBeenCalledWith(true)

    await window.electronAPI.app.quit()
    expect(mockAPI.app.quit).toHaveBeenCalledWith()
  })
})
