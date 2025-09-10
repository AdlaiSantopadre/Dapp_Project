// services/storachaClient.js
import * as Client from '@storacha/w3up-client'

let singleton = null

/**
 * Restituisce un client Storacha (w3up) inizializzato
 */
export async function getStorachaClient () {
  if (singleton) return singleton

  const email = process.env.STORACHA_EMAIL
  const spaceDid = process.env.STORACHA_SPACE_DID

  if (!email) {
    throw new Error('❌ Variabile STORACHA_EMAIL non impostata')
  }
  if (!spaceDid) {
    throw new Error('❌ Variabile STORACHA_SPACE_DID non impostata')
  }

  const client = await Client.create()

  // login con l'email registrata su Storacha
  try {
    await client.login(email)
  } catch (err) {
    console.error('❌ Errore login Storacha:', err.message)
    throw err
  }

  // forza lo space impostato via ENV
  try {
    await client.setCurrentSpace(spaceDid)
    console.log('[storacha] Current space impostato:', spaceDid)
  } catch (err) {
    console.error(`❌ Errore: impossibile impostare lo space ${spaceDid}`)
    throw err
  }

  singleton = client
  return client
}

