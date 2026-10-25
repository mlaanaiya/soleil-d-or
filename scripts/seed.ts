import { seedIfEmpty, ensureAdminFromEnv } from '../src/lib/server/seed'

async function main() {
  const log = (msg: string) => console.log(msg)
  const seeded = await seedIfEmpty(log)
  console.log(seeded ? 'Base initialisée.' : 'La base est déjà initialisée : rien à faire.')
  ensureAdminFromEnv(log)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
