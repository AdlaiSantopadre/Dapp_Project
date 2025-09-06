// db/mongo.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';
// 🔎 DEBUG LOG
console.log("🔎 [Mongo.js] MONGO_URI:", process.env.MONGO_URI);
console.log("🔎 [Mongo.js] DB_NAME:  ", process.env.DB_NAME);
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'documentiDb';
if (!uri || !dbName) {
  throw new Error("❌ Variabili MONGO_URI e DB_NAME non settate");
}

const client = new MongoClient(uri);
let db;

export async function connectToDb() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log(`[MongoDB] Connessione stabilita a ${dbName}`);
    
  }
  return db;
}

export async function getDocumentiCollection() {
  const db = await connectToDb();
  return db.collection('archivio_documenti');
}

