import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

const CLOUD = import.meta.env.VITE_CLOUD_NAME;
const PRESET = import.meta.env.VITE_UPLOAD_PRESET;

async function subir(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Error al subir la foto");
  return d.secure_url;
}

const aLocal = (ms) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function Publicar() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState({
    anio: "", tipoArticulo: "Automóvil", marca: "", modelo: "", motor: "",
    transmision: "Automática", combustible: "Gasolina", tren: "FWD", cilindros: "",
    dano: "verde", precioBase: 20000,
    inicio: aLocal(Date.now()), cierre: aLocal(Date.now() + 3 * 86400000),
  });
  const [fotos, setFotos] = useState([]);
  const [conPujas, setConPujas] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!id) return;
    api(`/vehiculos/${id}`).then((v) => {
      setF({ ...v, inicio: aLocal(v.inicio), cierre: aLocal(v.cierre) });
      setFotos(v.fotos);
      setConPujas(v.numPujas > 0);
    }).catch((x) => setMsg({ t: "err", m: x.message }));
  }, [id]);

  const elegir = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setSubiendo(true); setMsg(null);
    try {
      const urls = await Promise.all(files.map(subir));
      setFotos((p) => [...p, ...urls]);
    } catch (x) { setMsg({ t: "err", m: x.message }); }
    finally { setSubiendo(false); e.target.value = ""; }
  };

  const enviar = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (fotos.length < 5) return setMsg({ t: "err", m: "Sube mínimo 5 fotografías" });
    setGuardando(true);
    try {
      const body = { ...f, fotos, inicio: new Date(f.inicio).toISOString(), cierre: new Date(f.cierre).toISOString() };
      const v = id
        ? await api(`/vehiculos/${id}`, { method: "PUT", body })
        : await api("/vehiculos", { method: "POST", body });
      nav(`/subasta/${v.id}`);
    } catch (x) { setMsg({ t: "err", m: x.message }); } finally { setGuardando(false); }
  };

  return (
    <form className="panel" onSubmit={enviar}>
      <h2 style={{ marginTop: 0 }}>{id ? "Editar publicación" : "Publicar vehículo"}</h2>
      {conPujas && <div className="msg err">Ya hay ofertas: el monto base y las fechas no se pueden modificar.</div>}

      <h3>Ficha técnica</h3>
      <div className="g2">
        <div><label>Año</label><input type="number" value={f.anio} onChange={set("anio")} required /></div>
        <div><label>Tipo de artículo</label>
          <select value={f.tipoArticulo} onChange={set("tipoArticulo")}>
            <option>Automóvil</option><option>Camioneta</option><option>Pickup</option><option>Motocicleta</option><option>Camión</option>
          </select></div>
        <div><label>Marca</label><input value={f.marca} onChange={set("marca")} required /></div>
        <div><label>Modelo</label><input value={f.modelo} onChange={set("modelo")} required /></div>
        <div><label>Motor</label><input placeholder="Ej. 2.0L" value={f.motor} onChange={set("motor")} required /></div>
        <div><label>Transmisión</label>
          <select value={f.transmision} onChange={set("transmision")}><option>Automática</option><option>Manual</option></select></div>
        <div><label>Combustible</label>
          <select value={f.combustible} onChange={set("combustible")}><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
        <div><label>Tren de manejo</label>
          <select value={f.tren} onChange={set("tren")}><option>AWD</option><option>FWD</option><option>RWD</option><option>4WD</option></select></div>
        <div><label>Cilindros</label><input type="number" min="1" value={f.cilindros} onChange={set("cilindros")} required /></div>
        <div><label>Estado de daño</label>
          <select value={f.dano} onChange={set("dano")}>
            <option value="verde">Verde: daño menor / limpio</option>
            <option value="amarillo">Amarillo: daño medio / reparable</option>
            <option value="rojo">Rojo: daño severo / salvamento</option>
          </select></div>
      </div>

      <h3>Parámetros de la subasta</h3>
      <div className="g2">
        <div><label>Monto base (mínimo Q. 20,000)</label><input type="number" min="20000" value={f.precioBase} onChange={set("precioBase")} disabled={conPujas} required /></div>
        <div><label>Inicio</label><input type="datetime-local" value={f.inicio} onChange={set("inicio")} disabled={conPujas} required /></div>
        <div><label>Cierre</label><input type="datetime-local" value={f.cierre} onChange={set("cierre")} disabled={conPujas} required /></div>
      </div>

      <h3>Fotografías ({fotos.length}/mínimo 5)</h3>
      <input type="file" accept="image/*" multiple onChange={elegir} disabled={subiendo} />
      {subiendo && <p className="muted">Subiendo fotos…</p>}
      <div className="fotos">
        {fotos.map((u, i) => (
          <div key={u} className="mini" style={{ backgroundImage: `url(${u})` }}>
            <button type="button" onClick={() => setFotos(fotos.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>

      {msg && <div className={`msg ${msg.t}`}>{msg.m}</div>}
      <button className="btn" style={{ marginTop: 16 }} disabled={guardando || subiendo}>
        {guardando ? "Guardando…" : id ? "Guardar cambios" : "Publicar vehículo"}
      </button>
    </form>
  );
}