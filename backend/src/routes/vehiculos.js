import { Router } from "express";
import { db } from "../firebase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const col = db.collection("vehiculos");

const DANOS = ["verde", "amarillo", "rojo"];
const TRENES = ["AWD", "FWD", "RWD", "4WD"];
const MONTO_MINIMO = 20000;

// Nunca se expone quién tiene la puja más alta
function publico(doc) {
  const { mejorPostorId, ...resto } = doc.data();
  return { id: doc.id, ...resto };
}

function validar(b) {
  const requeridos = [
    "anio", "tipoArticulo", "marca", "modelo", "motor", "transmision",
    "combustible", "tren", "cilindros", "dano", "precioBase", "inicio", "cierre",
  ];
  for (const c of requeridos) {
    if (b[c] === undefined || b[c] === null || b[c] === "") {
      return `El campo "${c}" es obligatorio`;
    }
  }
  const anio = Number(b.anio);
  if (!Number.isInteger(anio) || anio < 1950 || anio > new Date().getFullYear() + 1) {
    return "Año inválido";
  }
  if (!DANOS.includes(String(b.dano).toLowerCase())) {
    return "El daño debe ser verde, amarillo o rojo";
  }
  if (!TRENES.includes(String(b.tren).toUpperCase())) {
    return "Tren de manejo debe ser AWD, FWD, RWD o 4WD";
  }
  if (!Number.isInteger(Number(b.cilindros)) || Number(b.cilindros) < 1) {
    return "Número de cilindros inválido";
  }
  if (!(Number(b.precioBase) >= MONTO_MINIMO)) {
    return `El monto base mínimo es Q. ${MONTO_MINIMO}`;
  }
  const ini = new Date(b.inicio).getTime();
  const fin = new Date(b.cierre).getTime();
  if (isNaN(ini) || isNaN(fin)) return "Fechas inválidas";
  if (fin <= ini) return "El cierre debe ser posterior al inicio";
  if (fin <= Date.now()) return "El cierre debe estar en el futuro";
  if (
    !Array.isArray(b.fotos) ||
    b.fotos.length < 5 ||
    !b.fotos.every((u) => typeof u === "string" && u.startsWith("https://"))
  ) {
    return "Debes subir mínimo 5 fotografías";
  }
  return null;
}

function armar(b) {
  return {
    anio: Number(b.anio),
    tipoArticulo: String(b.tipoArticulo).trim(),
    marca: String(b.marca).trim(),
    modelo: String(b.modelo).trim(),
    motor: String(b.motor).trim(),
    transmision: String(b.transmision).trim(),
    combustible: String(b.combustible).trim(),
    tren: String(b.tren).toUpperCase(),
    cilindros: Number(b.cilindros),
    dano: String(b.dano).toLowerCase(),
    precioBase: Number(b.precioBase),
    inicio: new Date(b.inicio).getTime(),
    cierre: new Date(b.cierre).getTime(),
    fotos: b.fotos,
  };
}

// GET /api/vehiculos  (público, con filtros)
router.get("/", async (req, res) => {
  try {
    const snap = await col.orderBy("creadoEn", "desc").get();
    let lista = snap.docs.map(publico);

    const igual = (campo, val) =>
      String(campo).toLowerCase() === String(val).toLowerCase();
    const contiene = (campo, val) =>
      String(campo).toLowerCase().includes(String(val).toLowerCase());

    const { marca, modelo, anio, combustible, dano, transmision, tren,
            cilindros, tipoArticulo, motor, q } = req.query;

    if (marca) lista = lista.filter((v) => contiene(v.marca, marca));
    if (modelo) lista = lista.filter((v) => contiene(v.modelo, modelo));
    if (motor) lista = lista.filter((v) => contiene(v.motor, motor));
    if (tipoArticulo) lista = lista.filter((v) => contiene(v.tipoArticulo, tipoArticulo));
    if (anio) lista = lista.filter((v) => v.anio === Number(anio));
    if (cilindros) lista = lista.filter((v) => v.cilindros === Number(cilindros));
    if (combustible) lista = lista.filter((v) => igual(v.combustible, combustible));
    if (transmision) lista = lista.filter((v) => igual(v.transmision, transmision));
    if (tren) lista = lista.filter((v) => igual(v.tren, tren));
    if (dano) lista = lista.filter((v) => igual(v.dano, dano));
    if (q) {
      lista = lista.filter((v) =>
        contiene(`${v.marca} ${v.modelo} ${v.anio}`, q)
      );
    }

    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/vehiculos/mios  (mis publicaciones, con búsqueda)
router.get("/mios", requireAuth, async (req, res) => {
  try {
    const snap = await col.where("ownerId", "==", req.user.id).get();
    let lista = snap.docs.map(publico).sort((a, b) => b.creadoEn - a.creadoEn);
    const { q } = req.query;
    if (q) {
      const t = String(q).toLowerCase();
      lista = lista.filter((v) =>
        `${v.marca} ${v.modelo} ${v.anio}`.toLowerCase().includes(t)
      );
    }
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/vehiculos/:id  (público)
router.get("/:id", async (req, res) => {
  try {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Vehículo no encontrado" });
    res.json(publico(doc));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/vehiculos  (requiere login)
router.post("/", requireAuth, async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ error });

    const nuevo = {
      ...armar(req.body),
      ownerId: req.user.id,
      pujaActual: 0,
      numPujas: 0,
      mejorPostorId: null,
      creadoEn: Date.now(),
    };
    const ref = await col.add(nuevo);
    const doc = await ref.get();
    res.status(201).json(publico(doc));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/vehiculos/:id  (solo el dueño)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const ref = col.doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Vehículo no encontrado" });
    if (doc.data().ownerId !== req.user.id) {
      return res.status(403).json({ error: "Solo puedes editar tus publicaciones" });
    }

    const actual = doc.data();
    const cambios = armar({ ...actual, ...req.body });

    // Con pujas ya realizadas no se puede cambiar el monto base ni las fechas
    if (actual.numPujas > 0) {
      cambios.precioBase = actual.precioBase;
      cambios.inicio = actual.inicio;
      cambios.cierre = actual.cierre;
    }

    const error = validar({
      ...cambios,
      inicio: cambios.inicio,
      cierre: actual.numPujas > 0 ? Date.now() + 1 : cambios.cierre,
    });
    if (error) return res.status(400).json({ error });

    await ref.update(cambios);
    res.json(publico(await ref.get()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;