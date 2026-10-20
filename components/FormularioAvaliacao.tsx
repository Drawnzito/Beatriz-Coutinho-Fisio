"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ResultadoAcao } from "@/lib/resultadoAcao";

export function FormularioAvaliacao({
  perguntas,
  action,
  sessaoId,
  rotuloBotao = "Enviar avaliação",
}: {
  perguntas: string[];
  action: (anterior: ResultadoAcao, formData: FormData) => Promise<ResultadoAcao>;
  sessaoId?: string;
  rotuloBotao?: string;
}) {
  const [notas, setNotas] = useState<number[]>(perguntas.map(() => 0));
  const [comentario, setComentario] = useState("");

  // O agradecimento vem da resposta do servidor. Antes era um useState ligado
  // no onSubmit: aparecia no clique e ficava lá mesmo quando a avaliação não
  // era gravada — a paciente achava que tinha mandado e a Beatriz nunca via.
  const [estado, enviar] = useFormState(action, null);

  if (estado?.ok) {
    return (
      <p style={{ fontSize: 13.5, color: "var(--cor-primaria)", fontWeight: 600, margin: 0 }}>
        Obrigado pela sua avaliação!
      </p>
    );
  }

  const completo = notas.every((n) => n > 0);

  return (
    /* Sem o véu global de "Salvando…": esta ação não troca de tela, e o véu
       só se desfaz quando a URL muda. O próprio botão mostra o progresso. */
    <form action={enviar} data-sem-indicador="1" style={{ display: "grid", gap: 14 }}>
      {sessaoId && <input type="hidden" name="sessao_id" value={sessaoId} />}
      {perguntas.map((pergunta, i) => (
        <div key={i}>
          <p style={{ margin: "0 0 6px", fontSize: 13.5 }}>{pergunta}</p>
          <input type="hidden" name={`nota_${i + 1}`} value={notas[i]} />
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((estrela) => (
              <button
                key={estrela}
                type="button"
                onClick={() => setNotas((prev) => prev.map((v, idx) => (idx === i ? estrela : v)))}
                aria-label={`${estrela} estrela${estrela > 1 ? "s" : ""}`}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 24,
                  padding: 0,
                  lineHeight: 1,
                  color: estrela <= notas[i] ? "var(--cor-acento)" : "var(--cor-borda)",
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      ))}

      <textarea
        name="comentario"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Comentário (opcional)"
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

      {estado && !estado.ok && (
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#a2334a" }}>{estado.erro}</p>
      )}

      <BotaoEnviar completo={completo} rotulo={rotuloBotao} />
    </form>
  );
}

/** Componente à parte porque useFormStatus só lê o formulário acima dele. */
function BotaoEnviar({ completo, rotulo }: { completo: boolean; rotulo: string }) {
  const { pending } = useFormStatus();
  const liberado = completo && !pending;

  return (
    <button
      type="submit"
      disabled={!liberado}
      style={{
        padding: "9px 16px",
        borderRadius: 8,
        border: "none",
        background: completo ? "var(--cor-primaria)" : "var(--cor-borda)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 13.5,
        cursor: liberado ? "pointer" : "not-allowed",
        justifySelf: "start",
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? "Enviando…" : rotulo}
    </button>
  );
}
