// routes/impianti.js 
//accede al file JSON e restituisce la lista degli impianti censiti  
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// In ESM (__dirname non è definito di default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /impianti
router.get('/', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../config/impianti.json');
    console.log("Leggo impianti da:", filePath); // 👈 percorso assoluto
    const raw = fs.readFileSync(filePath, 'utf-8');
    const impianti = JSON.parse(raw);
    res.json(impianti);
  } catch (err) {
    console.error("❌ Errore lettura impianti:", err);
    res.status(500).json({ error: 'Errore lettura impianti' });
  }
});
export default router;


