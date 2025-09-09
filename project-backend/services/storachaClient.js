// services/storachaClient.js
import * as Client from '@storacha/client'
import { StoreConf } from '@storacha/client/stores/conf'
import path from 'path'

let singleton = null

export async function getStorachaClient () {
  if (singleton) return singleton

  const storeFile = process.env.STORACHA_STORE_FILE || '/data/storacha/storacha-cli.json'

  const store = new StoreConf({
    dir: path.dirname(storeFile),
    configName: path.basename(storeFile, '.json'),
  })

  const client = await Client.create({ store })

  const spaceDid = process.env.STORACHA_SPACE_DID
  const spaces = (await client.spaces?.()) || []
  if (spaceDid) {
    try {
      await client.setCurrentSpace(spaceDid)
    } catch {
      try { await client.addSpace(spaceDid) } catch {}
      await client.setCurrentSpace(spaceDid)
    }
  } else if (spaces.length) {
    await client.setCurrentSpace(spaces[0].did?.() ?? spaces[0].did)
  } else {
    throw new Error('[storacha] Nessuno space disponibile')
  }

  console.log('[storacha] currentSpace:', (await client.currentSpace())?.did?.() ?? '<unknown>')

  singleton = client
  return singleton
}
