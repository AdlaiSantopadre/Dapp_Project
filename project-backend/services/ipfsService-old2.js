// services/ipfsService.js
import { create as createClient } from '@storacha/client';
import { File } from '@web-std/file';
import { once } from 'node:events';
import { Readable } from 'node:stream';








/** Convert Readable → Buffer */
async function streamToBuffer(stream) {
  const chunks = [];
  stream.on('data', (c) => chunks.push(c));
  stream.on('error', (e) => { throw e; });
  await once(stream, 'end');
  return Buffer.concat(chunks);
}

function makeStorachaClient() {
  const {
    STORACHA_SPACE_DID,
    STORACHA_AGENT_SECRET,
    STORACHA_DATA_DIR,
    STORACHA_ENDPOINT,
    STORACHA_PROOFS,
  } = process.env;

  if (!STORACHA_SPACE_DID || !STORACHA_AGENT_SECRET) {
    throw new Error('Missing Storacha env vars (STORACHA_SPACE_DID / STORACHA_AGENT_SECRET)');
  }
// Proviamo a parsare le proofs se presenti
  let proofs = [];
  if (STORACHA_PROOFS) {
    try {
      proofs = JSON.parse(STORACHA_PROOFS);
      console.log(`[storacha] Loaded ${proofs.length} proofs from STORACHA_PROOFS`);
    } catch (err) {
      console.error('❌ Errore parsing STORACHA_PROOFS:', err.message);
    }
  }
  // Inizializza UNA volta (promessa condivisa)
  const clientP = (async () => {
    const client = await createClient({
      space: STORACHA_SPACE_DID,        // DID dello Space
      agentSecret: STORACHA_AGENT_SECRET, // secret, non principal
      dataDir: STORACHA_DATA_DIR,
      endpoint: STORACHA_ENDPOINT,
      proofs,                          // deleghe di storage 

    });

    // Assicura che lo space esista e sia corrente
    try { await client.addSpace(STORACHA_SPACE_DID); } catch {}
    await client.setCurrentSpace(STORACHA_SPACE_DID);

    const current = await (client.currentSpace?.() ?? null);
    const did = current?.did?.() ?? current?.did ?? '<unknown>';
    console.log('[storacha] currentSpace:', did);

    return client;
  })();

  return {
    /**
     * put({ name, data, size?, mimetype? }) → { cid, size }
     * data: Buffer | Uint8Array | Readable
     */
    async put({ name, data, size, mimetype }) {
      if (!name || !data) {
        throw new Error('ipfsService.put: missing name or data');
      }

      // Normalizza il buffer
      let buf;
      if (Buffer.isBuffer(data)) {
        buf = data;
      } else if (data instanceof Uint8Array) {
        buf = Buffer.from(data);
      } else if (data instanceof Readable) {
        buf = await streamToBuffer(data);
      } else {
        throw new Error('ipfsService.put: "data" must be Buffer | Uint8Array | Readable');
      }

      const fileSize = typeof size === 'number' && size > 0 ? size : buf.length;
      const type = mimetype || 'application/octet-stream';

      const client = await clientP;

      // Crea un File “web-like” dal buffer
      const file = new File([buf], name, { type });

      let out;
      try {
        out = await client.uploadFile(file);
      } catch (e) {
        // Propaga un errore pulito verso la route
        const msg = e?.message || String(e);
        throw new Error(`[storacha] uploadFile failed: ${msg}`);
      }

      // Normalizza il CID per le diverse versioni del client
      const cid =
        (typeof out === 'string' && out) ||
        out?.cid ||
        out?.root?.toString?.() ||
        out?.toString?.();

      if (!cid) {
        throw new Error('[storacha] uploadFile returned no CID');
      }
      return { cid: String(cid), size: fileSize };
    },
    /**
     * get(cid) → { name, data (Buffer), mimetype }
     */
    async get(cid) {
      if (!cid) throw new Error('ipfsService.get: CID mancante');

      const client = await clientP;
      const file = await client.downloadFile(cid);
      if (!file) throw new Error(`ipfsService.get: file non trovato per CID ${cid}`);

      const buf = Buffer.from(await file.arrayBuffer());

      return {
        name: file.name || `${cid}.pdf`,
        data: buf,
        mimetype: file.type || 'application/pdf',
      };
    },
    // (opzionale) health check semplice
    async health() {
      try {
        await clientP;
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || String(e) };
      }
    },
  };
}

export function makeStorage() {
  const useReal = process.env.TEST_E2E === '1' || process.env.IPFS_USE_REAL === '1';
  return useReal
    ? makeStorachaClient()
    : {
        async put() {
          return { cid: 'bafyMOCKcid', size: 0 };
        },
        async get(cid) {
          return {
            name: 'mock.pdf',
            data: Buffer.from('%PDF-1.4\n%mock\n', 'utf8'), // file PDF fake
            mimetype: 'application/pdf',
          };
        },
      };
}
// Note rapide

// Compatibilità: l’API resta identica (storage.put({ name, data, size, mimetype }) → { cid, size }).
// Robustezza: ora accetta anche Readable (utile se si caricano stream).

// Errori chiari: gli errori di Storacha vengono “wrappati” con un prefisso — più facile da leggere nei log.

// CID normalizzato: gestisce i casi string, { cid }, { root }, ecc.

// Mock: invariato con IPFS_USE_REAL/TEST_E2E.