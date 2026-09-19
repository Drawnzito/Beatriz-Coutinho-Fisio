"use client";

import { useState } from "react";

export function CampoValidade() {
  const [valor, setValor] = useState("");

  function daquiDias(n: number) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setValor(d.toISOString().slice(0, 10));
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
        Válido até (opcional — deixe em branco pra não expirar):
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          name="validade"
          type="date"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={campo}
        />
        <button type="button" onClick={() => daquiDias(3)} style={botaoChip}>
          +3 dias
        </button>
        <button type="button" onClick={() => daquiDias(7)} style={botaoChip}>
          +7 dias
        </button>
        {valor && (
          <button type="button" onClick={() => setValor("")} style={botaoChip}>
            limpar
          </button>
        )}
      </div>
    </div>
  );
}

const campo: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  fontSize: 14,
  fontFamily: "var(--fonte-corpo)",
  flex: 1,
  minWidth: 150,
};

const botaoChip: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
