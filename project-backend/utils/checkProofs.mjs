import { create } from '@storacha/client'
import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const {
    STORACHA_SPACE_DID,
    STORACHA_AGENT_SECRET,
    STORACHA_DATA_DIR,
    STORACHA_ENDPOINT,
  } = process.env

  console.log('=== CHECK PROOFS DEBUG ===')
  console.log('Space DID atteso:', STORACHA_SPACE_DID)
  console.log('Data dir:', STORACHA_DATA_DIR)

  // verifica che il file esista
  const storeFile = path.join(STORACHA_DATA_DIR || '', 'w3up-client.json')
  if (fs.existsSync(storeFile)) {
    console.log('📂 Store file trovato:', storeFile)
  } else {
    console.warn('⚠️  Store file NON trovato:', storeFile)
  }

  try {
    const client = await create({
      space: STORACHA_SPACE_DID,
      agentSecret: STORACHA_AGENT_SECRET,
      dataDir: STORACHA_DATA_DIR,
      endpoint: STORACHA_ENDPOINT || 'https://up.web3.storage',
    })

    const principal = client.agent?.did?.() ?? client.agent?.did
    console.log('👤 Agent DID:', principal)

    const current = await client.currentSpace()
    console.log('📌 Current space DID:', current?.did?.() ?? current?.did)

    const proofs = await client.proofs()
    console.log('🔑 Proofs trovate:', proofs.length)

    for (const [i, p] of proofs.entries()) {
      console.log(`  #${i + 1}`)
      console.log('    iss:', p.issuer.did())
      console.log('    aud:', p.audience.did())
      console.log('    capabilities:')
      for (const cap of p.capabilities) {
        console.log(`      - can: ${cap.can}, with: ${cap.with}`)
      }
    }
  } catch (err) {
    console.error('❌ Errore nel caricamento client/proofs:', err.message)
  }

  console.log('=== END CHECK ===')
}

main()