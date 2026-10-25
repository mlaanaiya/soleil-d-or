export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // On Vercel the database is prepared during the build (`npm run vercel-build`), not on every cold start.
  if (process.env.VERCEL) return
  const { seedIfEmpty, ensureAdminFromEnv } = await import('./lib/server/seed')
  const log = (msg: string) => console.log(`[soleil-d-or] ${msg}`)
  try {
    if (await seedIfEmpty(log)) log('Base initialisée avec les photos du restaurant.')
    await ensureAdminFromEnv(log)
  } catch (error) {
    console.error('[soleil-d-or] Échec de l’initialisation des données', error)
  }
}
