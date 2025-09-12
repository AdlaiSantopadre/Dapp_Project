import "dotenv/config";

import { createApp } from "./app.mjs";
import { makeStorage } from "../services/ipfsService.js";
import { connectToDb } from "../db/mongo.js";

const PORT = process.env.PORT || 8080;


try {
  await connectToDb(); // connessione aperta all’avvio
  const storage = makeStorage(); // decide mock o Storacha reale
  const app = createApp({ storage });
  app.listen(PORT, () => {
  console.log("Backend server avviato");
  //console.log(`Server is running on http://localhost:${PORT}`);
  });
  } catch (err) {
  console.error("Errore inizializzazione backend:", err.message);
  process.exit(1);
  }






