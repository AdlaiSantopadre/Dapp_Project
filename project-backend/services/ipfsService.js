// services/ipfsService.js
import { create as createClient } from '@storacha/client';
import { File } from '@web-std/file';
import { once } from 'node:events';
import { Readable } from 'node:stream';

async function streamToBuffer(stream) {
  const chunks = [];
  stream.on('data', (c) => chunks.push(c));
  await once(stream, 'end');
  return Buffer.concat(chunks);
}


// function makeMockStorage() {
//   return {
//     async put({ name, data, size, mimetype }) {
//       console.log(`[IPFS MOCK] name=${name}, size=${size}, mime=${mimetype}`)
//       return { cid: 'bafyMOCKcid', size }
//     }
//   }
// }

function makeStorachaClient() {
  const {
    STORACHA_SPACE_DID,
    STORACHA_AGENT_SECRET,
    STORACHA_DATA_DIR,
    STORACHA_ENDPOINT,
  } = process.env

  if (!STORACHA_SPACE_DID || !STORACHA_AGENT_SECRET) {
    throw new Error('Missing Storacha env vars (STORACHA_SPACE_DID / STORACHA_AGENT_SECRET)')
  }

  // crea il client UNA VOLTA; usa await dentro ai metodi
  const clientP = (async () => {
    const client = await createClient({
      space: process.env.STORACHA_SPACE_DID,   // DID dello Space
      agentSecret: process.env.STORACHA_AGENT_SECRET, // opzionale in Railway
      dataDir:process.env.STORACHA_DATA_DIR,
      endpoint: process.env.STORACHA_ENDPOINT
    })
    // assicurati che lo Space ENV sia nello store e impostalo come corrente
    try { await client.addSpace(STORACHA_SPACE_DID) } catch { }
    await client.setCurrentSpace(STORACHA_SPACE_DID)

    // (debug) mostra lo space effettivo
    const current = await (client.currentSpace?.() ?? null)
    const did = current?.did?.() ?? current?.did ?? '<unknown>'
    console.log('[storacha] currentSpace set to:', did)

    return client
  })()

  return {
    async put({ name, data, size, mimetype }) {
      if (!name || !data || !size) throw new Error('ipfsService.put: bad input')
      const client = await clientP
      console.log("DEBUG uploadFile typeof:", typeof client.uploadFile)
      const buffer =
    Buffer.isBuffer(data) ? data :
    (data instanceof Readable) ? await streamToBuffer(data) :
    (() => { throw new Error('data must be Buffer or Readable') })()
      // usa un File “web-like” da Buffer
      const file = new File([buffer], name, { type: mimetype || 'application/octet-stream' })

      // alcune versioni ritornano stringa, altre oggetto → normalizza
      const out = await client.uploadFile(file)
      const cid =
        typeof out === 'string'
          ? out
          : out?.cid ?? out?.root?.toString?.() ?? out?.toString?.()

      if (!cid) throw new Error('uploadFile returned no CID')
      return { cid, size }
    }
  }
}
export function makeStorage() {
  const useReal = process.env.TEST_E2E === '1' || process.env.IPFS_USE_REAL === '1'
  return useReal ? makeStorachaClient() : { put: async () => ({ cid: 'bafyMOCKcid', size: 0 }) }
}

