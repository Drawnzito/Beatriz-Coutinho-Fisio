"use client";

import { useState } from "react";
import { FormularioAvaliacao } from "./FormularioAvaliacao";
import { enviarAvaliacaoApp } from "@/app/perfil/actions";
import { PERGUNTAS_APP } from "@/lib/avaliacoes";

export function AvaliarApp() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} style={botao}>
        ★ Avaliar o aplicativo
      </button>
    );
  }

  return (
    <div style={{ textAlign: "left", padding: 14, borderRadius: 12, border: "1px solid var(--cor-borda)" }}>
      <FormularioAvaliacao perguntas={PERGUNTAS_APP} action={enviarAvaliacaoApp} rotuloBotao="Enviar avaliação" />
    </div>
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
