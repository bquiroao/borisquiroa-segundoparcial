import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { db } from "./firebase.js";
import authRoutes from "./routes/auth.js";
import vehiculosRoutes from "./routes/vehiculos.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/vehiculos", vehiculosRoutes);

const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));