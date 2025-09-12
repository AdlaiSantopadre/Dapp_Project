// services/ipfsService.js
import * as Client from '@storacha/client'
import { File } from '@web-std/file'
import { StoreMemory } from '@storacha/client/stores/memory'
import * as Proof from '@storacha/client/proof'
import { Signer } from '@storacha/client/principal/ed25519'

function makeStorachaClient() {
  const { KEY, PROOF } = process.env
  if (!KEY || !PROOF) {
    throw new Error('Missing env vars: KEY (agent secret) and PROOF (UCAN delegation)')
  }

  const clientP = (async () => {
    // 1. parse private key
    const principal = Signer.parse(KEY)

    // 2. in-memory store
    const store = new StoreMemory()

    // 3. create client
    const client = await Client.create({ principal, store })

    // 4. add proof and set current space
    const proof = await Proof.parse(PROOF)
    const space = await client.addSpace(proof)
    await client.setCurrentSpace(space.did())

    console.log('[storacha] currentSpace set to:', space.did())
    return client
  })()

  return {
    async put({ name, data, size, mimetype }) {
      if (!name || !data) throw new Error('ipfsService.put: bad input')
      const client = await clientP
      const file = new File([data], name, { type: mimetype || 'application/octet-stream' })

      const out = await client.uploadFile(file)
      const cid = typeof out === 'string'
        ? out
        : out?.cid ?? out?.root?.toString?.() ?? out?.toString?.()

      if (!cid) throw new Error('uploadFile returned no CID')
      return { cid, size: file.size }
    }
  }
}

export function makeStorage() {
  return makeStorachaClient()
}
