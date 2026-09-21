"use client";

import { useEffect, useState } from "react";

export function BotoesPdfEvolucao({ pacienteId, nomePaciente }: { pacienteId: string; nomePaciente: string }) {
  const [podeCompartilhar, setPodeCompartilhar] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);

  const url = `/dashboard/evolucao/${pacienteId}/pdf`;

  useEffect(() => {
    const suportado =
      typeof navigator !== "undefined" &&
      "canShare" in navigator &&
      navigator.canShare({ files: [new File([], "teste.pdf", { type: "application/pdf" })] });
    setPodeCompartilhar(!!suportado);
  }, []);

  async function compartilhar() {
    setCompartilhando(true);
    try {
      const resposta = await fetch(url);
      const blob = await resposta.blob();
      const arquivo = new File([blob], `evolucao-${nomePaciente}.pdf`, { type: "application/pdf" });
      await navigator.share({
        files: [arquivo],
        title: `Evolução — ${nomePaciente}`,
        text: `Evolução do tratamento de ${nomePaciente}`,
      });
    } catch {
      // usuário cancelou o compartilhamento ou o navegador recusou — sem feedback de erro
    } finally {
      setCompartilhando(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <a href={url} target="_blank" rel="noreferrer" style={botaoSecundario}>
        Baixar PDF
      </a>
      {podeCompartilhar && (
        <button type="button" onClick={compartilhar} disabled={compartilhando} style={botaoSecundario}>
          {compartilhando ? "Preparando..." : "Compartilhar"}
        </button>
      )}
    </div>
  );
}

const botaoSecundario: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};
