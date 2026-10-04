"use client";

import { useState } from "react";
import { criarIndicacao } from "@/app/perfil/actions";

export function IndicarAmiga() {
  const [aberto, setAberto] = useState(false);
  const [enviado, setEnviado] = useState(false);

  return (
    <div
      style={{
        textAlign: "left",
        padding: 16,
        borderRadius: 14,
        background: "linear-gradient(135deg, var(--cor-primaria-escura), var(--cor-primaria))",
        color: "#fff",
      }}
    >
      <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 16 }}>Indique uma amiga 💛</strong>
      <p style={{ margin: "6px 0 12px", fontSize: 13, color: "rgba(255,255,255,0.88)" }}>
        Indique alguém pra fisioterapia pélvica domiciliar e ela ganha <strong>50% na primeira sessão</strong>.
        Válido só pra atendimento domiciliar.
      </p>

      {enviado ? (
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Indicação enviada! Obrigada 🙏</p>
      ) : !aberto ? (
        <button type="button" onClick={() => setAberto(true)} style={botaoAbrir}>
          Indicar uma amiga
        </button>
      ) : (
        <form
          action={criarIndicacao}
          onSubmit={() => setEnviado(true)}
          style={{ display: "grid", gap: 8 }}
        >
          <input name="nome_indicada" placeholder="Nome da amiga" required style={campo} />
          <input name="contato_indicada" placeholder="WhatsApp ou email dela" required style={campo} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" style={botaoEnviar}>Enviar indicação</button>
            <button type="button" onClick={() => setAberto(false)} style={botaoCancelar}>cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

const campo: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.4)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontSize: 13.5,
  fontFamily: "var(--fonte-corpo)",
};

const botaoAbrir: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const botaoEnviar: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  border: "none",
  background: "#fff",
  color: "var(--cor-primaria-escura)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const botaoCancelar: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.8)",
  fontSize: 12.5,
  cursor: "pointer",
};
