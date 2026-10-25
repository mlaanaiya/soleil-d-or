import readline from 'node:readline'
import { Writable } from 'node:stream'
import { passwordProblem, upsertUser } from '../src/lib/server/security'

/** Usage : npm run admin:create -- <identifiant>  (le mot de passe est demandé sans être affiché) */
const username = process.argv[2]?.trim()
if (!username) {
  console.error('Usage : npm run admin:create -- <identifiant>')
  process.exit(1)
}

let muted = false
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) process.stdout.write(chunk)
    callback()
  },
})
const rl = readline.createInterface({ input: process.stdin, output, terminal: true })
const ask = (question: string) =>
  new Promise<string>((resolve) => {
    process.stdout.write(question)
    muted = true
    rl.question('', (answer) => {
      muted = false
      process.stdout.write('\n')
      resolve(answer)
    })
  })

async function main(name: string) {
  const password = process.env.ADMIN_PASSWORD || (await ask('Mot de passe (10 caractères minimum) : '))
  rl.close()
  const problem = passwordProblem(password)
  if (problem) throw new Error(problem)
  upsertUser(name, password)
  console.log(`Compte « ${name} » enregistré.`)
}

main(username).catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
