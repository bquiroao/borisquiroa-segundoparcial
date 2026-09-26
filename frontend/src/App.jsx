import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Publicar from "./pages/Publicar.jsx";
import MisPublicaciones from "./pages/MisPublicaciones.jsx";
import Subasta from "./pages/Subasta.jsx";

function Privada({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  return user ? children : <Navigate to="/login" state={{ desde: loc.pathname }} replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="autor">Proyecto desarrollado por Boris Alexander Quiroa Orellana · Carnet 1890-22-1413</div>
      <header className="top">
        <div className="wrap nav">
          <Link to="/" className="logo">🚗 SubastaGT</Link>
          <nav>
            <Link to="/">Inventario</Link>
            {user ? (
              <>
                <Link to="/publicar">Publicar</Link>
                <Link to="/mis-publicaciones">Mis publicaciones</Link>
                <span className="hola">Hola, {user.nombre}</span>
                <button className="btn ghost" onClick={logout}>Salir</button>
              </>
            ) : (
              <>
                <Link to="/login">Ingresar</Link>
                <Link to="/registro" className="btn">Regístrate</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/subasta/:id" element={<Subasta />} />
          <Route path="/publicar" element={<Privada><Publicar /></Privada>} />
          <Route path="/editar/:id" element={<Privada><Publicar /></Privada>} />
          <Route path="/mis-publicaciones" element={<Privada><MisPublicaciones /></Privada>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="foot">Regístrese · Encuentre · Oferte<br />Desarrollado por Boris Alexander Quiroa Orellana · Carnet 1890-22-1413</footer>
    </>
  );
}