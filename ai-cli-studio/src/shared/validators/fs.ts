import { z } from 'zod/v4'

export const FSListDirSchema = z.object({
  path: z.string().min(1),
})

export const FSReadFileSchema = z.object({
  path: z.string().min(1),
})

export const FSGetFileInfoSchema = z.object({
  path: z.string().min(1),
})

export const FsDirEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  isDirectory: z.boolean(),
  isFile: z.boolean(),
})

export const FsFileInfoSchema = z.object({
  size: z.number(),
  isDirectory: z.boolean(),
  isFile: z.boolean(),
  modifiedAt: z.number(),
})
