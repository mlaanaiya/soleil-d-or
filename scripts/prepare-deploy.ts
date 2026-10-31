import { spawnSync } from 'node:child_process'

/** Vercel build step: demo snapshot when PGLITE_SNAPSHOT is set, otherwise migrate/seed the real database. */
const script = process.env.PGLITE_SNAPSHOT ? 'scripts/snapshot.ts' : 'scripts/seed.ts'
const run = spawnSync('npx', ['tsx', '--conditions=react-server', script], { stdio: 'inherit', env: process.env })
process.exit(run.status ?? 1)
