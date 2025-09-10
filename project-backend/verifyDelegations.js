// verifyDelegations.mjs
import fs from 'node:fs'
import path from 'node:path'

const storeFile = process.env.STORACHA_STORE_FILE || '/data/storacha/storacha-cli.json'

try {
  const raw = fs.readFileSync(storeFile, 'utf8')
  const json = JSON.parse(raw)

  console.log('=== STORACHA STORE DEBUG ===')
  console.log('File:', storeFile)
  console.log('Agent (principal.id):', json?.principal?.id || '<none>')
  console.log('Meta:', json?.meta || {})

  // Spazi censiti nello store
  const spaces = Array.isArray(json?.spaces?.$map) ? json.spaces.$map : []
  console.log('\nSpaces dichiarati nello store:')
  for (const [did, obj] of spaces) {
    console.log('-', did, JSON.stringify(obj))
  }

  // Delegazioni presenti
  const delegations = Array.isArray(json?.delegations?.$map) ? json.delegations.$map : []
  console.log('\nDelegations trovate:')
  for (const [cid, obj] of delegations) {
    const iss = obj?.meta?.issuer || obj?.iss || '<no-iss>'
    const aud = obj?.meta?.audience?.name || obj?.aud || '<no-aud>'
    console.log(`# ${cid}`)
    console.log('  iss:', iss)
    console.log('  aud:', aud)
    if (Array.isArray(obj?.delegation)) {
      console.log('  att:', obj.delegation.length, 'entries')
    } else if (Array.isArray(obj?.att)) {
      console.log('  att:', obj.att.map(a => `${a.can} with ${a.with}`).join(', '))
    }
  }

  console.log('\n=== END DEBUG ===')
} catch (e) {
  console.error('❌ Errore lettura/parsing store:', e.message)
  process.exit(1)
}