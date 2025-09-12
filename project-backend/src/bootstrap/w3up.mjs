// src/bootstrap/w3up.mjs
import fs from 'node:fs'
import path from 'node:path'

export function restoreW3upConfigFromEnv() {
  const b64 = process.env.W3UP_CLIENT_JSON_B64
  if (!b64) return

  const dataDir = process.env.STORACHA_DATA_DIR || './.storacha'
  const cfgDir = path.resolve(dataDir)
  const target = path.join(cfgDir, 'w3up-client.json')

  fs.mkdirSync(cfgDir, { recursive: true })
  if (!fs.existsSync(target)) {
    const buf = Buffer.from(b64, 'base64')
    fs.writeFileSync(target, buf)
    console.log(`[storacha] restored w3up-client.json to ${target}`)
  }
}