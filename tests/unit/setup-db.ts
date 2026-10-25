import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Points DATA_DIR at a fresh temporary directory; must run before any server module is imported. */
export function createTempDataDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'soleil-test-'))
  process.env.DATA_DIR = dir
  return dir
}
