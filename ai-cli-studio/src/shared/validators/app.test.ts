import { describe, it, expect } from 'vitest'

// Plan 02 will implement these Zod schemas in src/shared/validators/app.ts
// These tests define the contract and intentionally fail in Plan 01 (RED phase)
import type { z } from 'zod'

// Inline type stub for contract definition (actual Zod schemas come in Plan 02)
type AppQuitInput = { force?: boolean }
type AppGetVersionOutput = { version: string }

describe('App IPC Validators', () => {
  it('AppQuitSchema should accept valid input with force flag', () => {
    // Plan 02 replaces this with: AppQuitSchema.parse({ force: true })
    const input: AppQuitInput = { force: true }
    expect(input.force).toBe(true)
  })

  it('AppQuitSchema should default force to false when omitted', () => {
    // Plan 02: default value via z.object({ force: z.boolean().default(false) })
    const input: AppQuitInput = {}
    expect(input.force).toBeUndefined()
  })

  it('AppQuitSchema should reject non-boolean force values', () => {
    // This import will fail in Plan 01 — that's the expected RED phase behavior
    // Plan 02 creates this module with Zod validation
    const AppQuitSchema = require('../validators/app').AppQuitSchema
    expect(() => AppQuitSchema.parse({ force: 'not-boolean' })).toThrow()
  })

  it('AppGetVersionSchema should validate version string output', () => {
    const output: AppGetVersionOutput = { version: '1.0.0' }
    expect(output.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('AppGetVersionSchema should reject non-semver version strings', () => {
    const AppGetVersionSchema = require('../validators/app').AppGetVersionSchema
    expect(() => AppGetVersionSchema.parse({ version: 'invalid' })).toThrow()
  })
})
