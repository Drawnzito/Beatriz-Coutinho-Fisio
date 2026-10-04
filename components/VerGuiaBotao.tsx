"use client";

import { useState } from "react";
import { GuiaPrimeirosPassos } from "./GuiaPrimeirosPassos";

export function VerGuiaBotao() {
  const [aberto, setAberto] = useState(false);

  if (aberto) {
    return (
      <div style={{ textAlign: "left" }}>
        <GuiaPrimeirosPassos />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setAberto(true)} style={botao}>
      Ver guia de primeiros passos
    </button>
  );
}

const botao: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
};
