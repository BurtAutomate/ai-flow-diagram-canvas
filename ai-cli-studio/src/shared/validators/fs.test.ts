import { describe, it, expect } from 'vitest'
import {
  FSListDirSchema,
  FSReadFileSchema,
  FSGetFileInfoSchema,
} from './fs'

describe('FSListDirSchema', () => {
  it('accepts a valid path object', () => {
    const result = FSListDirSchema.parse({ path: '/home/user/project' })
    expect(result).toEqual({ path: '/home/user/project' })
  })

  it('rejects missing path', () => {
    expect(() => FSListDirSchema.parse({})).toThrow()
  })
})

describe('FSReadFileSchema', () => {
  it('accepts a valid path object', () => {
    const result = FSReadFileSchema.parse({ path: '/home/user/project/file.ts' })
    expect(result).toEqual({ path: '/home/user/project/file.ts' })
  })

  it('rejects empty string path', () => {
    expect(() => FSReadFileSchema.parse({ path: '' })).toThrow()
  })
})

describe('FSGetFileInfoSchema', () => {
  it('accepts a valid path object', () => {
    const result = FSGetFileInfoSchema.parse({ path: '/home/user/project/file.ts' })
    expect(result).toEqual({ path: '/home/user/project/file.ts' })
  })
})
