import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const usuarios = db.collection("usuarios");

function firmarToken(u) {
  return jwt.sign(
    { id: u.id, correo: u.correo, nombre: u.nombre },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, correo, telefono, password } = req.body;

    if (![nombre, apellido, correo, telefono, password].every(Boolean)) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      return res.status(400).json({ error: "Correo inválido" });
    }
    if (!/^[0-9+\-\s]{8,15}$/.test(telefono)) {
      return res.status(400).json({ error: "Teléfono inválido" });
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        error: "La contraseña debe tener mínimo 8 caracteres, con letras y números",
      });
    }

    const correoNorm = correo.trim().toLowerCase();
    const existe = await usuarios.where("correo", "==", correoNorm).limit(1).get();
    if (!existe.empty) {
      return res.status(409).json({ error: "Ese correo ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ref = await usuarios.add({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correoNorm,
      telefono: telefono.trim(),
      passwordHash,
      creadoEn: Date.now(),
    });

    const user = { id: ref.id, correo: correoNorm, nombre: nombre.trim() };
    res.status(201).json({ token: firmarToken(user), user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    const snap = await usuarios
      .where("correo", "==", correo.trim().toLowerCase())
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const ok = await bcrypt.compare(password, data.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = { id: doc.id, correo: data.correo, nombre: data.nombre };
    res.json({ token: firmarToken(user), user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me (requiere token)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;