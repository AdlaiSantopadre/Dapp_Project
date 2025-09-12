import fs from 'node:fs'
import path from 'node:path'
import * as Delegation from '@ucanto/core/delegation'

const storeFile = "C:/Users/campus.uniurb.it/AppData/Roaming/w3access/Config/w3up-client.json"

try {
  const raw = fs.readFileSync(storeFile, 'utf8')
  const json = JSON.parse(raw)

  console.log('=== STORACHA STORE DEBUG (FULL) ===')
  console.log('File:', storeFile)
  console.log('Agent (principal):', json?.principal?.id || json?.principal || '<none>')
  console.log('Meta:', json?.meta || {})

  // --------------------------------------------------------------------------
  // Spaces
  console.log('\nSpaces dichiarati nello store:')
  const spacesMap = json?.spaces?.$map
  if (spacesMap && typeof spacesMap === 'object') {
    for (const [k, v] of Object.entries(spacesMap)) {
      if (Array.isArray(v) && v.length >= 2) {
        console.log('-', v[0], JSON.stringify(v[1]))
      }
    }
  } else {
    console.log('(nessuno)')
  }

  // --------------------------------------------------------------------------
  // Delegations
  console.log('\nDelegations trovate (decodificate):')
  const delegationsMap = json?.delegations?.$map || {}

  for (const [cid, obj] of Object.entries(delegationsMap)) {
    let realCid = cid
    let realObj = obj

    // Caso: entry come [cid, { ... }]
    if (Array.isArray(obj) && obj.length === 2) {
      realCid = obj[0]
      realObj = obj[1]
    }

    console.log(`# ${realCid}`)

    if (Array.isArray(realObj?.delegation)) {
      for (const d of realObj.delegation) {
        if (d?.bytes?.$bytes) {
          const bytes = Uint8Array.from(d.bytes.$bytes)
          try {
            const delegation = await Delegation.import(bytes)

            console.log('  iss:', delegation.issuer.did())
            console.log('  aud:', delegation.audience.did())
            console.log('  exp:', delegation.expiry)
            console.log('  att:')
            for (const cap of delegation.capabilities) {
              console.log(`    - can: ${cap.can}`)
              console.log(`      with: ${cap.with}`)
            }
          } catch (err) {
            console.error('  ❌ Errore decode delegation:', err.message)
          }
        }
      }
    } else {
      console.log('  (nessuna delega decodificabile)')
    }

    console.log('')
  }

  console.log('=== END DEBUG ===')
} catch (e) {
  console.error('❌ Errore lettura/parsing store:', e.message)
  process.exit(1)
}
