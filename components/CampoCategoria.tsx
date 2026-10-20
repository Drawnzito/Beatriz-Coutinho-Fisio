"use client";

import { useState } from "react";

/**
 * Categoria do exercício: escolhe uma existente ou cria uma nova.
 *
 * Era um campo de texto livre, e isso é o bastante pra "Mobilidade",
 * "mobilidade" e "mobilidade " virarem três grupos diferentes na Biblioteca.
 * Escolher da lista é o caminho normal; criar nova continua possível, só
 * deixou de ser o padrão. A normalização final (minúsculas, sem espaço
 * sobrando) acontece ao salvar, no servidor.
 */
export function CampoCategoria({
  existentes,
  valorInicial,
  estilo,
}: {
  existentes: string[];
  valorInicial?: string | null;
  estilo?: React.CSSProperties;
}) {
  const atual = (valorInicial || "").trim();
  const conhecidas = [...new Set(existentes.map((c) => (c || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const [criandoNova, setCriandoNova] = useState(conhecidas.length === 0);
  const [valor, setValor] = useState(atual);

  if (criandoNova) {
    return (
      <div style={{ display: "grid", gap: 5 }}>
        <input
          name="categoria"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Nova categoria (ex: mobilidade)"
          autoFocus={conhecidas.length > 0}
          style={estilo}
        />
        {conhecidas.length > 0 && (
          <button type="button" onClick={() => setCriandoNova(false)} style={botaoLink}>
            escolher uma categoria que já existe
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 5 }}>
      <select name="categoria" value={valor} onChange={(e) => setValor(e.target.value)} style={estilo}>
        <option value="">Sem categoria</option>
        {conhecidas.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        {/* Categoria do exercício que saiu de uma grafia antiga ainda aparece. */}
        {atual && !conhecidas.includes(atual) && <option value={atual}>{atual}</option>}
      </select>
      <button type="button" onClick={() => setCriandoNova(true)} style={botaoLink}>
        + criar categoria nova
      </button>
    </div>
  );
}

const botaoLink: React.CSSProperties = {
  justifySelf: "start",
  padding: 0,
  border: "none",
  background: "none",
  color: "var(--cor-primaria)",
  fontFamily: "var(--fonte-corpo)",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "underline",
  cursor: "pointer",
};
