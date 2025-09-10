// scripts/initStoracha.mjs
import * as Client from '@storacha/w3up-client'

async function main () {
  const email = process.env.STORACHA_EMAIL
  if (!email) throw new Error('❌ STORACHA_EMAIL non impostata')

  const client = await Client.create()
  await client.login(email)

  // crea uno space nuovo con un nome leggibile
  const space = await client.createSpace('railway-backend')
  await client.setCurrentSpace(space.did())

  console.log('✅ Space creato:', space.did())
  console.log('ℹ️  Imposta STORACHA_SPACE_DID=', space.did(), 'nelle variabili Railway')
}

main().catch(err => {
  console.error('❌ Errore initStoracha:', err)
  process.exit(1)
})
