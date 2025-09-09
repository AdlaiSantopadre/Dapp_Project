import { getStorachaClient } from './storachaClient.js'
import { File } from '@web-std/file'
import { once } from 'node:events'
import { Readable } from 'node:stream'


/** Convert Readable → Buffer */
async function streamToBuffer(stream) {
    const chunks = []
    stream.on('data', (c) => chunks.push(c))
    stream.on('error', (e) => { throw e })
    await once(stream, 'end')
    return Buffer.concat(chunks)
}

export function makeStorage() {
    const useReal = process.env.TEST_E2E === '1' || process.env.IPFS_USE_REAL === '1'

    return useReal
        ? {
            /**
             * put({ name, data, size?, mimetype? }) → { cid, size }
             */
            async put({ name, data, size, mimetype }) {
                if (!name || !data) throw new Error('ipfsService.put: missing name or data')

                // normalizza il buffer
                let buf
                if (Buffer.isBuffer(data)) {
                    buf = data
                } else if (data instanceof Uint8Array) {
                    buf = Buffer.from(data)
                } else if (data instanceof Readable) {
                    buf = await streamToBuffer(data)
                } else {
                    throw new Error('ipfsService.put: "data" must be Buffer | Uint8Array | Readable')
                }

                const fileSize = typeof size === 'number' && size > 0 ? size : buf.length
                const type = mimetype || 'application/octet-stream'

                const client = await getStorachaClient()
                const file = new File([buf], name, { type })

                let out
                try {
                    out = await client.uploadFile(file)
                } catch (e) {
                    throw new Error(`[storacha] uploadFile failed: ${e?.message || String(e)}`)
                }

                const cid =
                    (typeof out === 'string' && out) ||
                    out?.cid ||
                    out?.root?.toString?.() ||
                    out?.toString?.()

                if (!cid) throw new Error('[storacha] uploadFile returned no CID')
                return { cid: String(cid), size: fileSize }
            },

            /**
             * get(cid) → { name, data (Buffer), mimetype }
             */
            async get(cid) {
                if (!cid) throw new Error('ipfsService.get: CID mancante')

                const client = await makeStorachaClient()
                const file = await client.downloadFile(cid)
                if (!file) throw new Error(`ipfsService.get: file non trovato per CID ${cid}`)

                const buf = Buffer.from(await file.arrayBuffer())
                return {
                    name: file.name || `${cid}.pdf`,
                    data: buf,
                    mimetype: file.type || 'application/pdf',
                }
            },

            async health() {
                try {
                    await makeStorachaClient()
                    return { ok: true }
                } catch (e) {
                    return { ok: false, error: e?.message || String(e) }
                }
            },
        }
        : {
            async put() {
                return { cid: 'bafyMOCKcid', size: 0 }
            },
            async get(cid) {
                return {
                    name: 'mock.pdf',
                    data: Buffer.from('%PDF-1.4\n%mock\n', 'utf8'),
                    mimetype: 'application/pdf',
                }
            },
        }
}
