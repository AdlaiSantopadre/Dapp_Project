// routes/archivioDocumenti.js
// gestisce l'archivio documenti (creazione, lettura, elenco)
// richiede autenticazione e ruoli specifici
// POST /archivioDocumenti/          { JSON metadata }  -> { ok, documento }
import { Router } from 'express';
import { createDocumento, setQrCid,listDocumentiAll, getDocumentoById, listDocumentiByImpianto } from '../services/documentiService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['CERTIFICATORE_ROLE']),
  async (req, res) => {
    try {
    const doc = await createDocumento(req.body);

    //risposta
    return res.status(201).json({
      ok : true,
      documento : doc
      });

    } catch (err) {
      console.error("❌ Errore creazione documento:", err);
      
      if (err.code === 11000) {
        return res.status(409).json({ 
          ok: false,
           error: 'Documento già esistente' });
      }     
      
      res.status(500).json({
        ok: false,
        error: 'Errore creazione documento' });
    }
  }
);

router.patch('/:id/qr',
  authMiddleware,
  roleMiddleware(['CERTIFICATORE_ROLE']),
  async (req, res) => {
    const updated = await setQrCid( req.params.id, req.body.qrCid );
    console.log("📌 PATCH result:", updated);
    if (!updated) return res.status(404).json({ error: 'Documento non trovato' });
    res.json({ message: 'Documento completato', documento: updated });
  }
);
// 🔽 1) TUTTI I DOCUMENTI
router.get('/',
  authMiddleware,
  roleMiddleware(['CERTIFICATORE_ROLE','MANUTENTORE_ROLE','ISPETTORE_ROLE','ADMIN_ROLE']),
  async (req, res) => {
    try {
      const items = await listDocumentiAll();
      res.json(items);
    } catch (err) {
      console.error('[archivio] listAll error:', err);
      res.status(500).json({ error: 'Errore lettura archivio documenti' });
    }
  }
);
// 🔽 2) PER IMPIANTO
router.get('/impianto/:impiantoId',
  authMiddleware,
  roleMiddleware(['CERTIFICATORE_ROLE','MANUTENTORE_ROLE','ISPETTORE_ROLE','ADMIN_ROLE']),
  async (req, res) => {
    try {
      const items = await listDocumentiByImpianto(req.params.impiantoId);
      res.json(items);
    } catch (err) {
      console.error('[archivio] byImpianto error:', err);
      res.status(500).json({ error: 'Errore lettura documenti per impianto' });
    }
  }
);

// 🔽 3) DETTAGLIO PER ID
router.get('/:id',
  authMiddleware,
  roleMiddleware(['CERTIFICATORE_ROLE','MANUTENTORE_ROLE','ISPETTORE_ROLE','ADMIN_ROLE']),
  async (req, res) => {
    try {
      const doc = await getDocumentoById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Documento non trovato' });
      res.json(doc);
    } catch (err) {
      console.error('[archivio] byId error:', err);
      res.status(500).json({ error: 'Errore lettura documento' });
    }
  }
);


export default router;
