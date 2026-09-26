import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nombre: "", apellido: "", correo: "", telefono: "", password: "" });
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setErr(""); setCargando(true);
    try { await register(f); nav("/"); }
    catch (x) { setErr(x.message); } finally { setCargando(false); }
  };

  return (
    <form className="panel form" onSubmit={enviar}>
      <h2>Crear cuenta</h2>
      <div className="g2">
        <div className="field"><label>Nombre</label><input value={f.nombre} onChange={set("nombre")} required /></div>
        <div className="field"><label>Apellido</label><input value={f.apellido} onChange={set("apellido")} required /></div>
      </div>
      <div className="field"><label>Correo electrónico</label><input type="email" value={f.correo} onChange={set("correo")} required /></div>
      <div className="field"><label>Teléfono</label><input value={f.telefono} onChange={set("telefono")} required /></div>
      <div className="field"><label>Contraseña (mín. 8, con letras y números)</label><input type="password" value={f.password} onChange={set("password")} required /></div>
      {err && <div className="msg err">{err}</div>}
      <button className="btn block" disabled={cargando}>{cargando ? "Creando…" : "Registrarme"}</button>
      <p className="muted" style={{ marginTop: 14 }}>¿Ya tienes cuenta? <Link to="/login" style={{ color: "var(--brand)" }}>Ingresa</Link></p>
    </form>
  );
}