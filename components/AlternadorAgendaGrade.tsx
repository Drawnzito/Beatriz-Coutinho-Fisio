"use client";

import { useState } from "react";
import { IconeGrade, IconeLista } from "./IconesPainel";

/**
 * Troca entre "por dia" e "em grade" sem navegar — os dois já vêm prontos
 * do servidor na mesma carga (mesmo truque do PainelNavegacao: tudo
 * renderizado, só o `hidden` muda). Antes isso era um link com querystring
 * (`?visaoAgenda=grade`), e cada clique recarregava a página inteira — a
 * Agenda sozinha dispara ~20 consultas, então alternar via URL ficava
 * perceptivelmente lento. Clicar num dia específico DENTRO da grade continua
 * navegando de verdade (ali é inevitável: o dia escolhido tem dados que só
 * essa carga busca).
 */
export function AlternadorAgendaGrade({
  visaoDia,
  visaoGrade,
}: {
  visaoDia: React.ReactNode;
  visaoGrade: React.ReactNode;
}) {
  const [emGrade, setEmGrade] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setEmGrade((v) => !v)}
        style={{
          justifySelf: "start",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 14px",
          marginBottom: 18,
          borderRadius: 999,
          border: "1px solid var(--cor-primaria)",
          background: emGrade ? "var(--cor-primaria)" : "var(--cor-acento-suave)",
          color: emGrade ? "#fff" : "var(--cor-primaria-escura)",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {emGrade ? <IconeLista /> : <IconeGrade />}
        {emGrade ? "Ver por dia" : "Ver semana em grade"}
      </button>

      <div hidden={emGrade}>{visaoDia}</div>
      <div hidden={!emGrade}>{visaoGrade}</div>
    </>
  );
}
