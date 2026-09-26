import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { db } from "./firebase.js";
import { iniciarTiempoReal } from "./realtime.js";
import authRoutes from "./routes/auth.js";
import vehiculosRoutes from "./routes/vehiculos.js";
import pujasRoutes from "./routes/pujas.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await db.collection("_ping").doc("x").set({ t: Date.now() });
    res.json({ ok: true, mensaje: "API y Firestore funcionando" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Hora del servidor, para sincronizar el reloj del cliente
app.get("/api/hora", (req, res) => res.json({ ahora: Date.now() }));

app.use("/api/auth", authRoutes);
app.use("/api/vehiculos", vehiculosRoutes);
app.use("/api/pujas", pujasRoutes);

const server = http.createServer(app);
iniciarTiempoReal(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));