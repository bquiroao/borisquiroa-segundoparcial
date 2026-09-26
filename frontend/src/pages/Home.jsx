import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Q } from "../api.js";
import { useAhora, fmtRestante, DanoTag } from "../ui.jsx";

const vacio = { q: "", marca: "", modelo: "", anio: "", combustible: "", transmision: "", tren: "", cilindros: "", tipoArticulo: "", dano: "" };

function Tarjeta({ v, ahora }) {
  const cerrada = ahora >= v.cierre;
  const antes = ahora < v.inicio;
  const precio = v.numPujas > 0 ? v.pujaActual : v.precioBase;
  return (
    <Link to={`/subasta/${v.id}`} className="card">
      <div className="foto" style={{ backgroundImage: `url(${v.fotos[0]})` }}>
        <DanoTag dano={v.dano} />
      </div>
      <div className="cbody">
        <h3>{v.anio} {v.marca} {v.modelo}</h3>
        <p className="muted">{v.motor} · {v.transmision} · {v.combustible} · {v.tren}</p>
        <div className="row">
          <div>
            <small>{v.numPujas > 0 ? "Oferta actual" : "Monto base"}</small>
            <strong className="precio">{Q(precio)}</strong>
          </div>
          <div className="right">
            <small>{cerrada ? "Estado" : antes ? "Inicia en" : "Cierra en"}</small>
            <strong>{cerrada ? "Cerrada" : fmtRestante((antes ? v.inicio : v.cierre) - ahora)}</strong>
          </div>
        </div>
        <span className="btn block">{cerrada ? "Ver resultado" : "Ofertar ahora"}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const [f, setF] = useState(vacio);
  const [lista, setLista] = useState(null);
  const [err, setErr] = useState("");
  const ahora = useAhora();
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });

  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
    const t = setTimeout(() => {
      api(`/vehiculos?${p}`).then((d) => { setLista(d); setErr(""); }).catch((x) => setErr(x.message));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  return (
    <>
      <section className="hero">
        <h1>Encuentra tu próximo vehículo en subasta</h1>
        <p className="muted">Ofertas en tiempo real, sin recargar la página.</p>
        <div className="pasos">
          <span className="paso">1 · Regístrese</span>
          <span className="paso">2 · Encuentre</span>
          <span className="paso">3 · Oferte</span>
        </div>
      </section>

      <section className="filtros">
        <div className="fgrid">
          <div><label>Buscar</label><input placeholder="Marca, modelo, año…" value={f.q} onChange={set("q")} /></div>
          <div><label>Marca</label><input value={f.marca} onChange={set("marca")} /></div>
          <div><label>Modelo</label><input value={f.modelo} onChange={set("modelo")} /></div>
          <div><label>Año</label><input type="number" value={f.anio} onChange={set("anio")} /></div>
          <div><label>Combustible</label>
            <select value={f.combustible} onChange={set("combustible")}>
              <option value="">Todos</option><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option>
            </select></div>
          <div><label>Transmisión</label>
            <select value={f.transmision} onChange={set("transmision")}>
              <option value="">Todas</option><option>Automática</option><option>Manual</option>
            </select></div>
          <div><label>Tren de manejo</label>
            <select value={f.tren} onChange={set("tren")}>
              <option value="">Todos</option><option>AWD</option><option>FWD</option><option>RWD</option><option>4WD</option>
            </select></div>
          <div><label>Cilindros</label><input type="number" value={f.cilindros} onChange={set("cilindros")} /></div>
          <div><label>Tipo de artículo</label>
            <select value={f.tipoArticulo} onChange={set("tipoArticulo")}>
              <option value="">Todos</option><option>Automóvil</option><option>Camioneta</option><option>Pickup</option><option>Motocicleta</option><option>Camión</option>
            </select></div>
        </div>
        <div className="chips">
          <strong style={{ fontSize: ".85rem" }}>Nivel de daño:</strong>
          {["", "verde", "amarillo", "rojo"].map((d) => (
            <button key={d} className={`chip ${d} ${f.dano === d ? "on" : ""}`} onClick={() => setF({ ...f, dano: d })}>
              {d ? d[0].toUpperCase() + d.slice(1) : "Todos"}
            </button>
          ))}
          <button className="chip" onClick={() => setF(vacio)}>Limpiar filtros</button>
        </div>
      </section>

      {err && <div className="msg err">{err}</div>}
      {lista === null && !err && <p className="muted">Cargando…</p>}
      {lista && lista.length === 0 && <div className="panel">No hay vehículos con esos filtros.</div>}
      <div className="grid">{lista && lista.map((v) => <Tarjeta key={v.id} v={v} ahora={ahora} />)}</div>
    </>
  );
}