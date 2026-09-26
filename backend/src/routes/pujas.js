import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../firebase.js";
import { requireAuth } from "../middleware/auth.js";
import { getIO } from "../realtime.js";

const router = Router();
const col = db.collection("vehiculos");

const err = (status, msg) => Object.assign(new Error(msg), { status });

// Mínimo permitido: monto base si no hay pujas; si hay, la actual + 10%
export const minimoSiguiente = (numPujas, pujaActual, precioBase) =>
  numPujas > 0 ? Math.ceil((pujaActual * 110) / 100) : precioBase;

// POST /api/pujas/:id  { monto }   (requiere login)
router.post("/:id", requireAuth, async (req, res) => {
  const monto = Number(req.body.monto);
  if (!Number.isInteger(monto) || monto <= 0) {
    return res.status(400).json({ error: "El monto debe ser un número entero en quetzales" });
  }

  const ref = col.doc(req.params.id);
  try {
    const r = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) throw err(404, "Vehículo no encontrado");
      const v = doc.data();
      const ahora = Date.now();

      if (ahora < v.inicio) throw err(400, "La subasta aún no ha iniciado");
      if (ahora >= v.cierre) throw err(400, "Oferta cerrada");
      if (v.ownerId === req.user.id) {
        throw err(403, "No puedes ofertar en tu propio vehículo");
      }
      if (monto < v.precioBase) {
        throw err(400, `La oferta no puede ser menor al monto base (Q. ${v.precioBase})`);
      }
      if (v.numPujas > 0 && monto <= v.pujaActual) {
        throw err(400, "La oferta debe superar la puja más alta actual");
      }
      const min = minimoSiguiente(v.numPujas, v.pujaActual, v.precioBase);
      if (monto < min) {
        throw err(400, `La oferta mínima es Q. ${min} (10% más que la actual)`);
      }

      tx.update(ref, {
        pujaActual: monto,
        numPujas: v.numPujas + 1,
        mejorPostorId: req.user.id,
      });
      return { previo: v.mejorPostorId, numPujas: v.numPujas + 1, cierre: v.cierre };
    });

    const siguiente = minimoSiguiente(r.numPujas, monto, 0);
    const io = getIO();
    if (io) {
      // Público y anónimo: solo monto, número de pujas y mínimo siguiente
      io.to(`v:${req.params.id}`).emit("puja:nueva", {
        vehiculoId: req.params.id,
        pujaActual: monto,
        numPujas: r.numPujas,
        minimoSiguiente: siguiente,
      });
      // Privado: avisos de estado
      if (r.previo && r.previo !== req.user.id) {
        io.to(`user:${r.previo}`).emit("puja:superada", { vehiculoId: req.params.id });
      }
      io.to(`user:${req.user.id}`).emit("puja:ganando", { vehiculoId: req.params.id });
    }

    res.status(201).json({ ok: true, pujaActual: monto, minimoSiguiente: siguiente });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/pujas/:id/estado  (público; con token indica si vas ganando)
router.get("/:id/estado", async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Vehículo no encontrado" });
    const v = doc.data();

    let uid = null;
    const h = req.headers.authorization || "";
    if (h.startsWith("Bearer ")) {
      try {
        uid = jwt.verify(h.slice(7), process.env.JWT_SECRET).id;
      } catch {}
    }

    res.json({
      pujaActual: v.pujaActual,
      numPujas: v.numPujas,
      minimoSiguiente: minimoSiguiente(v.numPujas, v.pujaActual, v.precioBase),
      inicio: v.inicio,
      cierre: v.cierre,
      ahora: Date.now(),
      ganando: !!uid && v.numPujas > 0 && v.mejorPostorId === uid,
      esDueno: !!uid && v.ownerId === uid,
      resultado: v.resultado || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;