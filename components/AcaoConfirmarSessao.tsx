"use client";

import { useState } from "react";
import { responderSessao } from "@/app/inicio/actions";
import { BadgeStatusSessao } from "./BadgeStatusSessao";
import { MOTIVOS_RECUSA_SUGERIDOS } from "@/lib/statusSessao";

export function AcaoConfirmarSessao({
  sessaoId,
  status,
  motivoRecusa,
}: {
  sessaoId: string;
  status: string | null | undefined;
  motivoRecusa?: string | null;
}) {
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (status === "confirmada" || status === "recusada") {
    return <BadgeStatusSessao status={status} motivoRecusa={motivoRecusa} />;
  }

  if (!recusando) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <form action={responderSessao}>
          <input type="hidden" name="sessao_id" value={sessaoId} />
          <input type="hidden" name="novo_status" value="confirmada" />
          <button type="submit" style={botaoConfirmar}>
            ✓ Confirmar presença
          </button>
        </form>
        <button type="button" onClick={() => setRecusando(true)} style={botaoRecusar}>
          Não vou poder ir
        </button>
      </div>
    );
  }

  return (
    <form
      action={responderSessao}
      style={{
        display: "grid",
        gap: 8,
        padding: 10,
        borderRadius: 10,
        border: "1px solid var(--cor-borda)",
        background: "var(--cor-fundo)",
      }}
    >
      <input type="hidden" name="sessao_id" value={sessaoId} />
      <input type="hidden" name="novo_status" value="recusada" />
      <input type="hidden" name="motivo" value={motivo} />

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
        Quer contar o motivo? É opcional.
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MOTIVOS_RECUSA_SUGERIDOS.map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            onClick={() => setMotivo(motivo === sugestao ? "" : sugestao)}
            style={{
              ...chip,
              background: motivo === sugestao ? "var(--cor-acento)" : "var(--cor-superficie)",
              color: motivo === sugestao ? "#fff" : "var(--cor-texto)",
              borderColor: motivo === sugestao ? "var(--cor-acento)" : "var(--cor-borda)",
            }}
          >
            {sugestao}
          </button>
        ))}
      </div>

      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ou escreva com suas palavras (opcional)"
        rows={2}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--cor-borda)",
          fontSize: 13,
          fontFamily: "var(--fonte-corpo)",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" style={botaoRecusarConfirmar}>
          Confirmar recusa
        </button>
        <button type="button" onClick={() => setRecusando(false)} style={botaoCancelar}>
          voltar
        </button>
      </div>
    </form>
  );
}

const botaoConfirmar: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "none",
  background: "#2f7a4f",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12.5,
  cursor: "pointer",
};

const botaoRecusar: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-texto-suave)",
  fontWeight: 600,
  fontSize: 12.5,
  cursor: "pointer",
};

const botaoRecusarConfirmar: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 8,
  border: "none",
  background: "#a2334a",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12.5,
  cursor: "pointer",
};

const botaoCancelar: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-texto-suave)",
  fontSize: 12.5,
  cursor: "pointer",
};

const chip: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  fontSize: 12,
  cursor: "pointer",
};
