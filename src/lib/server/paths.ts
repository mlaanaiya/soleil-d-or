import path from 'node:path'

export function dataDir(): string {
  return path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'))
}

export function mediaDir(): string {
  return path.join(dataDir(), 'media')
}

export function assetsDir(): string {
  return path.join(process.cwd(), 'assets')
}
