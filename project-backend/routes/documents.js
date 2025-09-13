// routes/documents.js
// carica e scarica documenti PDF/PNG su IPFS/Storacha
// richiede autenticazione e ruoli specifici
// POST /documents/upload  {form-data file: <file>}  -> { cid, hash, metadata }
// GET  /documents/:cid   -> file (con header Content-Type, Content-Disposition)

import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { sha256Hex } from '../utils/hash.js';

export default function documentsRouter({ storage }) {
  if (!storage || typeof storage.put !== 'function') {
    throw new Error('documentsRouter: storage.put function required');
  }

  const router = express.Router();

  // Limiti e filtro: solo PDF o PNG , max 20MB (configurabile)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const mime = (file.mimetype || '').toLowerCase();
      if (mime === 'application/pdf' || mime === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Formato non supportato: solo PDF o PNG ammessi'), false);
      }
    },
  });

  router.post(
    '/upload',
    authMiddleware,
    roleMiddleware(['CERTIFICATORE_ROLE']),
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'Nessun file caricato (atteso campo form-data "file")' });
        }
        if (!req.user) {
          return res.status(401).json({ error: 'Utente non autenticato' });
        }

        // indirizzo utente (dal token)
        const ethAddress = req.user.ethAddress || req.user.address || null;
        if (!ethAddress) {
          return res.status(400).json({ error: 'Wallet address mancante nel token (ethAddress)' });
        }

        const buffer = req.file.buffer;
        const originalName = req.file.originalname || 'document.pdf';
        const mime = req.file.mimetype || 'application/pdf';

        // 1) Hash locale del PDF (per immutabilità)
        const hash = sha256Hex(buffer);

        // 2) Upload su IPFS/Storacha
        await client.setCurrentSpace(SPACE_DID);
        const putResult = await storage.put({
          name: originalName,
          data: buffer,
          size: buffer.length,
          mimetype: mime,
        });
        const cid = putResult?.cid;
        if (!cid) {
          return res.status(502).json({ error: 'Upload su storage fallito (CID assente)' });
        }

        // 3) Metadata minimi (evita PII, mantieni tracciabilità tecnica)
        const metadata = JSON.stringify({
          filename: originalName,
          mime,
          uploadedBy: ethAddress,
          at: new Date().toISOString(),
        });

        /* 
        // 4) Registrazione on-chain
         const txHash = await registerDocumentOnChain(hash, cid, metadata);
         if (!txHash) {
           return res.status(502).json({ error: 'Registrazione on-chain fallita (txHash assente)' });
         }*/

        return res.status(201).json({ cid, hash, metadata });
      } catch (err) {
        if (err?.message?.includes('Formato non supportato')) {
          return res.status(415).json({ error: err.message });
        }
        if (err?.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File troppo grande' });
        }

        console.error('[documents/upload] error:', err);
        return res.status(500).json({ error: 'Upload fallito' });
      }
    }
  );
  router.get(
    '/:cid',
    authMiddleware,
    roleMiddleware(['MANUTENTORE_ROLE', 'ISPETTORE_ROLE', 'TITOLARE_ROLE']),
    async (req, res) => {
      try {
        const { cid } = req.params;
        if (!cid) {
          return res.status(400).json({ error: 'CID mancante' });
        }

        const file = await storage.get(cid);
        if (!file || !file.data) return res.status(404).json({ error: 'Documento non trovato' });
        // Imposta gli header per il download
        // Imposta intestazioni corrette
        res.setHeader('Content-Type', file.mimetype || 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${file.name || 'documento'}"`);

        return res.send(file.data);
      } catch (err) {
        console.error('[documents/get] error:', err);
        res.status(500).json({ error: 'Download fallito' });
      }
    }
  );


  return router;
}
