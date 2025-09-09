// services/storachaClient.js
import * as Client from '@storacha/client'
import { StoreConf } from '@storacha/client/stores/conf'
import path from 'path'
import { fileURLToPath } from 'url'

let singleton = null

export async function getStorachaClient () {
  if (singleton) return singleton

  // Percorso del file nel volume Railway (persistente)
const storeFile = process.env.STORACHA_STORE_FILE || '/data/storacha/storacha-cli.json'
const store = new StoreConf({
  dir: path.dirname(storeFile),
  configName: path.basename(storeFile, '.json'),
})
  
  singleton = await Client.create({ store })


  return singleton
}
