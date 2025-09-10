// services/ipfsService.js
import { File } from '@web-std/file'
import { once } from 'node:events'
import { Readable } from 'node:stream'
import { getStorachaClient } from './storachaClient.js'

async function streamToBuffer(stream) {
  const chunks = []
  stream.on('data', (c) => chunks.push(c))
  stream.on('error', (e) => { throw e })
  await once(stream, 'end')
  return Buffer.concat(chunks)
}

export function makeStorage () {
  return {
    async put({ name, data, size, mimetype }) {
      if (!name || !data) throw new Error('ipfsService.put: missing name or data')

      let buf
      if (Buffer.isBuffer(data)) buf = data
      else if (data instanceof Uint8Array) buf = Buffer.from(data)
      else if (data instanceof Readable) buf = await streamToBuffer(data)
      else throw new Error('ipfsService.put: "data" must be Buffer | Uint8Array | Readable')

      const type = mimetype || 'application/octet-stream'
      const file = new File([buf], name, { type })

      const client = await getStorachaClient()
      const res = await client.uploadFile(file)

      const cid =
        (typeof res === 'string' && res) ||
        res?.cid ||
        res?.root?.toString?.() ||
        res?.toString?.()

      if (!cid) throw new Error('ipfsService.put: uploadFile returned no CID')
      return { cid: String(cid), size: buf.length }
    },

    async get(cid) {
      if (!cid) throw new Error('ipfsService.get: CID mancante')

      const client = await getStorachaClient()
      const file = await client.downloadFile(cid)
      if (!file) throw new Error(`ipfsService.get: file non trovato per CID ${cid}`)

      const buf = Buffer.from(await file.arrayBuffer())
      return {
        name: file.name || `${cid}.pdf`,
        data: buf,
        mimetype: file.type || 'application/pdf',
      }
    }
  }
}

