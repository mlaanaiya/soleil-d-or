import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Builds the demo database snapshot: a fresh embedded database, seeded with the restaurant's
 * catalogue and photographs (+ the admin account from ADMIN_USERNAME / ADMIN_PASSWORD),
 * saved to PGLITE_SNAPSHOT (default snapshot/soleil-d-or.tar.gz).
 */
async function main() {
  const target = path.resolve(process.env.PGLITE_SNAPSHOT || 'snapshot/soleil-d-or.tar.gz')
  // Seed into a throwaway directory, never into the snapshot being replaced or a remote database.
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'soleil-snapshot-'))
  delete process.env.DATABASE_URL
  delete process.env.PGLITE_SNAPSHOT
  const { closeDb, dumpSnapshot } = await import('../src/lib/server/db')
  const { ensureAdminFromEnv, seedIfEmpty } = await import('../src/lib/server/seed')
  const log = (msg: string) => console.log(msg)
  await seedIfEmpty(log)
  await ensureAdminFromEnv(log)
  await dumpSnapshot(target)
  await closeDb()
  console.log(
    `Instantané écrit : ${path.relative(process.cwd(), target)} (${(fs.statSync(target).size / 1e6).toFixed(1)} Mo)`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
