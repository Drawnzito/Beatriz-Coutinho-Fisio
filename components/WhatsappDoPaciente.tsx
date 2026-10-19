"use client";

import { useState } from "react";
import { atualizarWhatsappPaciente } from "@/app/dashboard/actions";
import { formatarTelefone, linkWhatsapp } from "@/lib/telefone";

/**
 * WhatsApp da paciente, na ficha dela — visível e editável pela Beatriz.
 *
 * O campo existia só do lado da paciente (Perfil → "Seu WhatsApp"), e quase
 * nenhuma preenche. Na prática quem tem o número é a Beatriz, então a ficha
 * passou a ser o lugar de cadastrar.
 */
export function WhatsappDoPaciente({
  pacienteId,
  valorInicial,
}: {
  pacienteId: string;
  valorInicial: string | null | undefined;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial || "");

  if (editando) {
    return (
      <form action={atualizarWhatsappPaciente.bind(null, pacienteId)} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input
          name="whatsapp"
          placeholder="(81) 99999-9999"
          value={valor}
          onChange={(e) => setValor(formatarTelefone(e.target.value))}
          autoFocus
          style={campo}
        />
        <button type="submit" style={botaoSalvar}>Salvar</button>
        <button type="button" onClick={() => setEditando(false)} style={botaoLink}>
          cancelar
        </button>
      </form>
    );
  }

  return (
    <p style={{ margin: 0, fontSize: 13.5, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {valorInicial ? (
        <>
          <a
            href={linkWhatsapp(valorInicial)}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#2f7a4f", fontWeight: 600, textDecoration: "none" }}
          >
            💬 {valorInicial}
          </a>
          <button type="button" onClick={() => setEditando(true)} style={botaoLink}>
            editar
          </button>
        </>
      ) : (
        <>
          <span style={{ color: "var(--cor-texto-suave)" }}>Sem WhatsApp cadastrado</span>
          <button type="button" onClick={() => setEditando(true)} style={botaoLink}>
            cadastrar
          </button>
        </>
      )}
    </p>
  );
}

const campo: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  fontFamily: "var(--fonte-corpo)",
  fontSize: 13.5,
  minWidth: 160,
};

const botaoSalvar: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontFamily: "var(--fonte-corpo)",
  fontWeight: 600,
  fontSize: 13,
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
