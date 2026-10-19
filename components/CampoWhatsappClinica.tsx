"use client";

import { useState } from "react";
import { atualizarWhatsappContato } from "@/app/perfil/actions";
import { formatarTelefone } from "@/lib/telefone";

/**
 * Número da clínica — o que aparece no botão "Falar no WhatsApp" das pacientes.
 *
 * Nasceu porque o Perfil tinha dois campos de WhatsApp parecidos ("Seu
 * WhatsApp" e este) e era fácil preencher o errado: o número ia pro perfil
 * pessoal e o botão das pacientes continuava escondido, sem nada na tela
 * explicando por quê. Agora o estado é dito em voz alta: ativo ou escondido.
 */
export function CampoWhatsappClinica({ valorInicial }: { valorInicial: string | null | undefined }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial || "");

  if (!editando) {
    return valorInicial ? (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={selo("ativo")}>BOTÃO ATIVO</span>
          <strong style={{ fontSize: 14 }}>{valorInicial}</strong>
          <button type="button" onClick={() => setEditando(true)} style={botaoLink}>
            editar
          </button>
        </div>
        <p style={aviso}>É esse número que as pacientes veem no botão “Falar no WhatsApp”.</p>
      </div>
    ) : (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={selo("escondido")}>BOTÃO ESCONDIDO</span>
          <button type="button" onClick={() => setEditando(true)} style={botaoLink}>
            cadastrar número
          </button>
        </div>
        <p style={aviso}>
          Sem um número aqui, as pacientes não veem nenhum botão de WhatsApp — nem no Início, nem no Perfil,
          nem na assistente.
        </p>
      </div>
    );
  }

  return (
    <form action={atualizarWhatsappContato} style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          name="whatsapp_contato"
          placeholder="(81) 99999-9999"
          value={valor}
          onChange={(e) => setValor(formatarTelefone(e.target.value))}
          autoFocus
          style={campo}
        />
        <button type="submit" style={botaoSalvar}>Salvar</button>
      </div>
      <p style={aviso}>Número do WhatsApp da clínica, não o pessoal da paciente. Em branco, o botão some.</p>
    </form>
  );
}

function selo(estado: "ativo" | "escondido"): React.CSSProperties {
  return {
    padding: "2px 9px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.3,
    background: estado === "ativo" ? "#dff0e4" : "var(--cor-acento-suave)",
    color: estado === "ativo" ? "#2f7a4f" : "var(--cor-acento)",
  };
}

const aviso: React.CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  color: "var(--cor-texto-suave)",
};

const campo: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  fontFamily: "var(--fonte-corpo)",
  fontSize: 14,
};

const botaoSalvar: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontFamily: "var(--fonte-corpo)",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
};

const botaoLink: React.CSSProperties = {
  border: "none",
  background: "none",
  padding: 0,
  color: "var(--cor-primaria)",
  fontFamily: "var(--fonte-corpo)",
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: "underline",
  cursor: "pointer",
};
