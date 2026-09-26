import { createContext, useContext, useState } from "react";
import { api } from "./api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const guardar = (d) => {
    localStorage.setItem("token", d.token);
    localStorage.setItem("user", JSON.stringify(d.user));
    setUser(d.user);
  };
  const login = async (correo, password) =>
    guardar(await api("/auth/login", { method: "POST", body: { correo, password } }));
  const register = async (datos) =>
    guardar(await api("/auth/register", { method: "POST", body: datos }));
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}