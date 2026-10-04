"use client";

import { useState } from "react";
import { solicitarSessao } from "@/app/inicio/actions";
import { TIPOS_SESSAO } from "@/lib/tiposSessao";

export function SolicitarSessaoForm() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} style={botaoAbrir}>
        + Solicitar nova sessão
      </button>
    );
  }

  return (
    <form
      action={solicitarSessao}
      style={{
        display: "grid",
        gap: 8,
        padding: 14,
        borderRadius: 12,
        border: "1px solid var(--cor-borda)",
        background: "var(--cor-superficie)",
      }}
    >
      <strong style={{ fontSize: 13.5, color: "var(--cor-primaria-escura)" }}>Solicitar nova sessão</strong>
      <div style={{ display: "flex", gap: 8 }}>
        <input name="data" type="date" required style={campo} />
        <input name="hora" type="time" style={campo} />
      </div>
      <select name="tipo" defaultValue="tratamento" style={campo}>
        {TIPOS_SESSAO.map((t) => (
          <option key={t.valor} value={t.valor}>
            {t.rotulo}
          </option>
        ))}
      </select>
      <textarea name="observacoes" placeholder="Observações (opcional)" rows={2} style={campo} />
      <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
        A Beatriz precisa aprovar antes de ficar confirmada.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" style={botaoEnviar}>Enviar solicitação</button>
        <button type="button" onClick={() => setAberto(false)} style={botaoCancelar}>cancelar</button>
      </div>
    </form>
  );
}

const campo: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-fundo)",
  fontSize: 13.5,
  fontFamily: "var(--fonte-corpo)",
};

const botaoAbrir: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const botaoEnviar: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const botaoCancelar: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-texto-suave)",
  fontSize: 12.5,
  cursor: "pointer",
};
