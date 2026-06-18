import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Main Process Security', () => {
  it('should have contextIsolation: true in BrowserWindow config', () => {
    const source = readFileSync(join(__dirname, '../main/index.ts'), 'utf-8')
    expect(source).toContain('contextIsolation: true')
  })

  it('should have sandbox: true in BrowserWindow config', () => {
    const source = readFileSync(join(__dirname, '../main/index.ts'), 'utf-8')
    expect(source).toContain('sandbox: true')
  })

  it('should have nodeIntegration: false in BrowserWindow config', () => {
    const source = readFileSync(join(__dirname, '../main/index.ts'), 'utf-8')
    expect(source).toContain('nodeIntegration: false')
  })

  it('should have preload script configured in webPreferences', () => {
    const source = readFileSync(join(__dirname, '../main/index.ts'), 'utf-8')
    expect(source).toContain('preload')
  })
})
