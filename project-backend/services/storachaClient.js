// services/storachaClient.js
import * as Client from '@storacha/client'
import { StoreConf } from '@storacha/client/stores/conf'

let singleton = null

export async function getStorachaClient () {
  if (singleton) return singleton

  // Percorso del file nel volume Railway (persistente)
  const storeFile = process.env.STORACHA_STORE_FILE || '/data/storacha/storacha-cli.json'

  const store = new StoreConf({ path: storeFile })
  singleton = await Client.create({ store })

  // Se vuoi forzare lo space, decommenta e metti il DID:
  // await singleton.setCurrentSpace('did:key:z6Mkk7ogzC5YCuEsSExW4DPZ9So4iVAs8LQYg6yCeunzXNgp')

  return singleton
}
