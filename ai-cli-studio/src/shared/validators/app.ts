import { z } from 'zod'

export const AppQuitSchema = z.object({
  force: z.boolean().default(false),
})

export const AppQuitResult = z.object({
  success: z.boolean(),
  error: z.string().optional(),
})

export const AppGetVersionResult = z.string()

// Alias for test compatibility — the contract tests import AppGetVersionSchema
export const AppGetVersionSchema = AppGetVersionResult

export const AppGetCwdResult = z.string()

// Alias for test compatibility — the contract tests import AppGetCwdSchema
export const AppGetCwdSchema = AppGetCwdResult
