import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErr(""); setCargando(true);
    try {
      await login(correo, password);
      nav(loc.state?.desde || "/");
    } catch (x) { setErr(x.message); } finally { setCargando(false); }
  };

  return (
    <form className="panel form" onSubmit={enviar}>
      <h2>Ingresar</h2>
      <div className="field"><label>Correo</label><input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required /></div>
      <div className="field"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      {err && <div className="msg err">{err}</div>}
      <button className="btn block" disabled={cargando}>{cargando ? "Ingresando…" : "Ingresar"}</button>
      <p className="muted" style={{ marginTop: 14 }}>¿No tienes cuenta? <Link to="/registro" style={{ color: "var(--brand)" }}>Regístrate</Link></p>
    </form>
  );
}