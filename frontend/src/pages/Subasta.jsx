import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, conectarSocket, Q } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useAhora, fmtRestante, DanoTag, DANO } from "../ui.jsx";

export default function Subasta() {
  const { id } = useParams();
  const { user } = useAuth();
  const [v, setV] = useState(null);
  const [e, setE] = useState(null);
  const [off, setOff] = useState(0);
  const [foto, setFoto] = useState(0);
  const [monto, setMonto] = useState("");
  const [msg, setMsg] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mi, setMi] = useState(null); // null | "ganando" | "superada"
  const ahora = useAhora(off);

  const cargar = async () => {
    const [veh, est] = await Promise.all([api(`/vehiculos/${id}`), api(`/pujas/${id}/estado`)]);
    setV(veh);
    setE(est);
    setOff(est.ahora - Date.now());
    setMi((p) => (est.ganando ? "ganando" : p === "superada" ? "superada" : null));
  };

  useEffect(() => {
    cargar().catch((x) => setMsg({ t: "err", m: x.message }));
  }, [id]);

  useEffect(() => {
    const s = conectarSocket();
    s.on("connect", () => { s.emit("unirse", id); cargar().catch(() => {}); });
    s.on("puja:nueva", (d) => {
      if (d.vehiculoId !== id) return;
      setE((p) => p && { ...p, pujaActual: d.pujaActual, numPujas: d.numPujas, minimoSiguiente: d.minimoSiguiente });
    });
    s.on("puja:ganando", (d) => d.vehiculoId === id && setMi("ganando"));
    s.on("puja:superada", (d) => d.vehiculoId === id && setMi("superada"));
    s.on("subasta:cerrada", (d) => d.vehiculoId === id && setE((p) => p && { ...p, resultado: d.resultado }));
    return () => { s.emit("salir", id); s.disconnect(); };
  }, [id, user?.id]);

  const pujar = async (ev) => {
    ev.preventDefault();
    setMsg(null); setEnviando(true);
    try {
      await api(`/pujas/${id}`, { method: "POST", body: { monto: Number(monto) } });
      setMsg({ t: "ok", m: "Oferta registrada" });
      setMonto("");
    } catch (x) { setMsg({ t: "err", m: x.message }); } finally { setEnviando(false); }
  };

  if (!v || !e) return <p className="muted" style={{ padding: 30 }}>{msg ? msg.m : "Cargando…"}</p>;

  const cerrada = ahora >= v.cierre;
  const antes = ahora < v.inicio;
  const vendida = e.resultado ? e.resultado === "vendida" : e.numPujas > 0 && e.pujaActual >= v.precioBase;
  const fotos = v.fotos;
  const ficha = [
    ["Año", v.anio], ["Tipo", v.tipoArticulo], ["Marca", v.marca], ["Modelo", v.modelo],
    ["Motor", v.motor], ["Transmisión", v.transmision], ["Combustible", v.combustible],
    ["Tren de manejo", v.tren], ["Cilindros", v.cilindros],
  ];

  return (
    <div className="detalle">
      <section>
        <div className="carrusel">
          <img src={fotos[foto]} alt="Vehículo" />
          <button className="nav-c l" onClick={() => setFoto((foto - 1 + fotos.length) % fotos.length)}>‹</button>
          <button className="nav-c r" onClick={() => setFoto((foto + 1) % fotos.length)}>›</button>
        </div>
        <div className="thumbs">
          {fotos.map((u, i) => <img key={u} src={u} className={i === foto ? "on" : ""} onClick={() => setFoto(i)} />)}
        </div>
        <div className="panel">
          <h2 style={{ margin: 0 }}>{v.anio} {v.marca} {v.modelo}</h2>
          <p className="muted" style={{ margin: "6px 0" }}><DanoTag dano={v.dano} /> &nbsp;{DANO[v.dano]?.[1]}</p>
          <div className="ficha">
            {ficha.map(([k, val]) => <div key={k}><small>{k}</small><strong>{val}</strong></div>)}
          </div>
        </div>
      </section>

      <aside className="panel" style={{ alignSelf: "start" }}>
        <small className="muted">{e.numPujas > 0 ? "Oferta más alta actual" : "Monto base (sin ofertas)"}</small>
        <div className="monto">{Q(e.numPujas > 0 ? e.pujaActual : v.precioBase)}</div>
        <p className="muted">{e.numPujas} {e.numPujas === 1 ? "oferta" : "ofertas"}</p>

        <small className="muted">{cerrada ? "Estado" : antes ? "Inicia en" : "Tiempo restante"}</small>
        <div className="reloj">{cerrada ? "Oferta cerrada" : fmtRestante((antes ? v.inicio : v.cierre) - ahora)}</div>

        {mi === "ganando" && <div className="badge ganando">{cerrada ? "🏆 ¡Ganaste esta subasta!" : "✅ ¡Vas ganando esta subasta!"}</div>}
        {mi === "superada" && !cerrada && <div className="badge superada">⚠️ Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que termine el tiempo!</div>}
        {cerrada && (
          <div className="badge cerrada">
            {vendida ? "Subasta finalizada: vehículo vendido" : "Subasta desierta: no se alcanzó el monto base"}
          </div>
        )}

        {!cerrada && !antes && (
          user ? (
            e.esDueno ? <div className="badge info">Es tu publicación; no puedes ofertar.</div> : (
              <form onSubmit={pujar}>
                <label>Tu oferta (mínimo {Q(e.minimoSiguiente)})</label>
                <input type="number" value={monto} placeholder={String(e.minimoSiguiente)} onChange={(x) => setMonto(x.target.value)} required />
                <button className="btn block" disabled={enviando}>{enviando ? "Enviando…" : "Ofertar"}</button>
                <button type="button" className="btn ghost block" onClick={() => setMonto(String(e.minimoSiguiente))}>Usar oferta mínima</button>
              </form>
            )
          ) : (
            <div className="badge info">Para ofertar debes <Link to="/login" state={{ desde: `/subasta/${id}` }} style={{ textDecoration: "underline" }}>iniciar sesión</Link>.</div>
          )
        )}
        {antes && <div className="badge info">La subasta aún no ha iniciado.</div>}
        {msg && <div className={`msg ${msg.t}`}>{msg.m}</div>}
        <p className="muted" style={{ marginTop: 14 }}>Las ofertas son anónimas: solo se muestra el monto más alto.</p>
      </aside>
    </div>
  );
}