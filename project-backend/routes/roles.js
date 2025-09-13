// routes/roles.js
// gestisce l'assegnazione dei ruoli via smart contract
// richiede autenticazione e ruolo ADMIN_ROLE
// POST /roles/grant  { role, target }  -> { message, transaction }
// Utilizzato da admin per assegnare ruoli agli utenti (tramite wallet address )
// Ruoli possibili: ADMIN_ROLE, CERTIFICATORE_ROLE, MANUTENTORE_ROLE, ISPETTORE_ROLE, TITOLARE_ROLE
// Ruoli definiti nello smart contract DocumentRegistry.sol
// Utilizzato da CLI o interfaccia admin
import express from 'express';
import { grantUserRole, hasUserRole } from '../services/documentRegistry.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { normalizeAddress } from '../utils/normalize.js'; // se già presente nel progetto

const router = express.Router();

// opzionale: mappa alias → ruoli canonici del contratto
const ROLE_ALIASES = {
  admin: 'ADMIN_ROLE',
  ADMIN: 'ADMIN_ROLE',
  ADMIN_ROLE: 'ADMIN_ROLE',
  certificatore: 'CERTIFICATORE_ROLE',
  CERTIFICATORE_ROLE: 'CERTIFICATORE_ROLE',
  manutentore: 'MANUTENTORE_ROLE',
  MANUTENTORE_ROLE: 'MANUTENTORE_ROLE',
  ispettore: 'ISPETTORE_ROLE',
  ISPETTORE_ROLE: 'ISPETTORE_ROLE',
  titolare: 'TITOLARE_ROLE',
  TITOLARE_ROLE: 'TITOLARE_ROLE',
};

function toCanonicalRole(input) {
  if (!input) return null;
  const key = String(input).trim();
  return ROLE_ALIASES[key] || null;
}

/**
 * Assegna un ruolo reale via smart contract
 * Accesso: solo utenti con ruolo ADMIN_ROLE
 */
router.post(
  '/grant',
  authMiddleware,
  roleMiddleware(['ADMIN_ROLE']), // <-- aggiornato
  async (req, res) => {
    try {
      let { role, target } = req.body;

      // validazione base
      const canonicalRole = toCanonicalRole(role);
      if (!canonicalRole) {
        return res.status(400).json({
          error: 'Ruolo non valido',
          hint: 'Usa uno tra: ADMIN_ROLE, CERTIFICATORE_ROLE, MANUTENTORE_ROLE, ISPETTORE_ROLE, TITOLARE_ROLE',
          received: role,
        });
      }

      if (!target) {
        return res.status(400).json({ error: 'Dati mancanti: target è obbligatorio' });
      }

      // normalizza indirizzo
      const targetAddr = normalizeAddress ? normalizeAddress(target) : String(target).toLowerCase();

      // evita doppio grant se già assegnato
      const alreadyHasRole = await hasUserRole(canonicalRole, targetAddr);
      if (alreadyHasRole) {
        return res.json({
          message: `L'indirizzo ${targetAddr} ha già il ruolo "${canonicalRole}"`,
        });
      }

      // assegna ruolo
      const txHash = await grantUserRole(canonicalRole, targetAddr);
      return res.json({
        message: `Ruolo "${canonicalRole}" assegnato a ${targetAddr}`,
        transaction: txHash,
      });
    } catch (error) {
      console.error('[roles/grant] errore:', error);
      return res.status(500).json({
        error: 'Errore durante grantRole',
        details: error?.message || String(error),
      });
    }
  }
);


export default router;
