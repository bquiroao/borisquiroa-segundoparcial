import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { db } from "./firebase.js";

let io;
const pendientes = new Map(); // vehiculoId -> hora de cierre

export const getIO = () => io;

export function iniciarTiempoReal(server) {
  io = new Server(server, { cors: { origin: "*" } });

  // El token es opcional: anónimos pueden mirar, pero no reciben avisos privados
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (token) {
      try {
        socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {}
    }
    next();
  });

  io.on("connection", (socket) => {
    if (socket.data.user) socket.join(`user:${socket.data.user.id}`);

    socket.on("unirse", async (vehiculoId, ack) => {
      try {
        socket.join(`v:${vehiculoId}`);
        const doc = await db.collection("vehiculos").doc(String(vehiculoId)).get();
        if (doc.exists && doc.data().cierre > Date.now()) {
          pendientes.set(doc.id, doc.data().cierre);
        }
      } catch {}
      if (typeof ack === "function") ack({ ahora: Date.now() });
    });

    socket.on("salir", (vehiculoId) => socket.leave(`v:${vehiculoId}`));
  });

  // Revisa cada segundo (solo memoria, no consume lecturas de Firestore)
  setInterval(() => {
    const ahora = Date.now();
    for (const [id, cierre] of pendientes) {
      if (cierre <= ahora) {
        pendientes.delete(id);
        cerrar(id).catch(() => {});
      }
    }
  }, 1000);
}

async function cerrar(id) {
  const ref = db.collection("vehiculos").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return;
  const v = doc.data();
  const vendida = v.numPujas > 0 && v.pujaActual >= v.precioBase;
  const resultado = vendida ? "vendida" : "desierta";
  await ref.update({ resultado });
  io.to(`v:${id}`).emit("subasta:cerrada", {
    vehiculoId: id,
    resultado,
    pujaActual: v.pujaActual,
  });
  if (vendida && v.mejorPostorId) {
    io.to(`user:${v.mejorPostorId}`).emit("subasta:ganada", { vehiculoId: id });
  }
}