import { closeDb } from '../src/lib/server/db'
import { ensureAdminFromEnv, seedIfEmpty } from '../src/lib/server/seed'

/** Applies the migrations, imports the restaurant's photographs into an empty database and creates the admin. */
async function main() {
  const log = (msg: string) => console.log(msg)
  const seeded = await seedIfEmpty(log)
  console.log(seeded ? 'Base initialisée.' : 'La base est déjà initialisée : rien à faire.')
  await ensureAdminFromEnv(log)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => closeDb())
