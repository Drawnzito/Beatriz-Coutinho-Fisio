"use client";

import { useState } from "react";
import { FormularioAvaliacao } from "./FormularioAvaliacao";
import { enviarAvaliacaoAtendimento } from "@/app/inicio/actions";
import { PERGUNTAS_ATENDIMENTO } from "@/lib/avaliacoes";

export function AvaliarAtendimento({ sessaoId }: { sessaoId: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{
          marginTop: 6,
          padding: "5px 10px",
          borderRadius: 999,
          border: "1px solid var(--cor-borda)",
          background: "none",
          color: "var(--cor-acento)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ★ Avaliar atendimento
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--cor-borda)" }}>
      <FormularioAvaliacao
        perguntas={PERGUNTAS_ATENDIMENTO}
        action={enviarAvaliacaoAtendimento}
        sessaoId={sessaoId}
        rotuloBotao="Enviar avaliação"
      />
    </div>
  );
}
