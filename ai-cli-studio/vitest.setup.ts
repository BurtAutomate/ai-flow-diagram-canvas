/**
 * Vitest/Node.js `require()` hook for TypeScript files.
 *
 * Vitest 4's module runner provides a `require` function in test files that
 * delegates to Node.js's native module resolver. Node's resolver does not
 * recognise `.ts` / `.tsx` extensions, so `require('../validators/app')`
 * fails even though the file exists as `app.ts`.
 *
 * This patch teaches Node's `Module._resolveFilename` to try TypeScript
 * extensions before giving up. When the require'd file is a TypeScript
 * source the module runner has already transformed, the resolved path will
 * point to the in-memory Vite-transformed module rather than the raw source
 * on disk.
 *
 * See vitest-dev/vitest#846 — this is a known limitation of vitest's ESM-first
 * design. The patch is intentionally scoped to the relative/local paths used
 * by the Plan 01 contract tests (`require('../validators/...')` and
 * `require('../viewers/...')`).
 */
import Module from 'module'

const TS_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.node']

const originalResolveFilename = Module._resolveFilename as (
  request: string,
  parent: NodeModule,
  isMain: boolean,
  options?: Record<string, unknown>
) => string

Module._resolveFilename = function (
  request: string,
  parent: NodeModule,
  isMain: boolean,
  options?: Record<string, unknown>
): string {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options)
  } catch (firstError: unknown) {
    // Only try extension appending for relative paths
    if (!request.startsWith('.') || request.endsWith('.js')) {
      throw firstError
    }

    // Try appending .ts or .tsx extension
    for (const ext of TS_EXTENSIONS) {
      try {
        return originalResolveFilename.call(this, request + ext, parent, isMain, options)
      } catch {
        continue
      }
    }

    throw firstError
  }
}
