import { spawn } from 'node:child_process'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

/**
 * Runs the unit tests through the production driver (`postgres`, wire protocol) instead of
 * embedded PGlite, by exposing an in-memory PGlite over a local socket.
 */
async function main() {
  const db = await PGlite.create()
  const port = 15_432 + Math.floor(Math.random() * 1000)
  const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' })
  await server.start()
  const code = await new Promise<number>((resolve) => {
    const child = spawn('npx', ['vitest', 'run'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${port}/postgres`,
        DATABASE_POOL_SIZE: '1',
      },
    })
    child.on('exit', (c) => resolve(c ?? 1))
  })
  await server.stop()
  await db.close()
  process.exit(code)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
