export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { seedIfEmpty, ensureAdminFromEnv } = await import('./lib/server/seed')
  const log = (msg: string) => console.log(`[soleil-d-or] ${msg}`)
  try {
    if (await seedIfEmpty(log)) log('Base initialisée avec les photos du restaurant.')
    ensureAdminFromEnv(log)
  } catch (error) {
    console.error('[soleil-d-or] Échec de l’initialisation des données', error)
  }
}
