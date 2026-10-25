import path from 'node:path'

// Runtime locations: excluded from build tracing (they are data, not code).
export function dataDir(): string {
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'data'),
  )
}

export function assetsDir(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), 'assets')
}
