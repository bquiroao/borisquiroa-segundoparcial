import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// En producción la clave viene de una variable de entorno; en local, del archivo
const creds = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(
      fs.readFileSync(new URL("../serviceAccountKey.json", import.meta.url))
    );

initializeApp({ credential: cert(creds) });

export const db = getFirestore();