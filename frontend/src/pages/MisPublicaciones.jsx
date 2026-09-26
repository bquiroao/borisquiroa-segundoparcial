import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Q } from "../api.js";
import { DanoTag } from "../ui.jsx";

export default function MisPublicaciones() {
  const [q, setQ] = useState("");
  const [lista, setLista] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/vehiculos/mios?q=${encodeURIComponent(q)}`).then(setLista).catch((x) => setErr(x.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>Mis publicaciones</h2>
      <input placeholder="Buscar por marca, modelo o año…" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <div className="msg err">{err}</div>}
      {lista && lista.length === 0 && <p className="muted">No tienes publicaciones.</p>}
      <div className="grid" style={{ marginTop: 16 }}>
        {lista && lista.map((v) => (
          <div key={v.id} className="card">
            <div className="foto" style={{ backgroundImage: `url(${v.fotos[0]})` }}><DanoTag dano={v.dano} /></div>
            <div className="cbody">
              <h3>{v.anio} {v.marca} {v.modelo}</h3>
              <p className="muted">Base {Q(v.precioBase)} · {v.numPujas} ofertas</p>
              <div className="tabla-acc">
                <Link className="btn" to={`/editar/${v.id}`}>Editar</Link>
                <Link className="btn ghost" to={`/subasta/${v.id}`}>Ver</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}