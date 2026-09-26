import { useEffect, useState } from "react";

export function useAhora(offset = 0) {
  const [n, setN] = useState(Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setN(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  return n;
}

export function fmtRestante(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const p = (v) => String(v).padStart(2, "0");
  return (d > 0 ? d + "d " : "") + `${p(h)}:${p(m)}:${p(x)}`;
}

export const DANO = {
  verde: ["Verde", "Daño menor / Limpio"],
  amarillo: ["Amarillo", "Daño medio / Reparable"],
  rojo: ["Rojo", "Daño severo / Salvamento"],
};

export function DanoTag({ dano }) {
  return <span className={`dano ${dano}`}>{DANO[dano]?.[0]}</span>;
}