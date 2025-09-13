//file utilizzato per fare da proxy verso auth-server prima della ristrutturazione del codice
// project-backend/routes/auth.js
import express from 'express';

const router = express.Router();
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8081';

router.post('/login', async (req, res) => {
  try {
    const resp = await fetch(`${AUTH_SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json(data); // { error: ... }
    }
    // data = { token, user }
    return res.json(data);
  } catch (err) {
    console.error('[AUTH PROXY] errore:', err);
    return res.status(502).json({ error: 'Auth-server non raggiungibile' });
  }
});

export default router;

