"use client";

import { useState } from "react";

export function FormularioAvaliacao({
  perguntas,
  action,
  sessaoId,
  rotuloBotao = "Enviar avaliação",
}: {
  perguntas: string[];
  action: (formData: FormData) => void | Promise<void>;
  sessaoId?: string;
  rotuloBotao?: string;
}) {
  const [notas, setNotas] = useState<number[]>(perguntas.map(() => 0));
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <p style={{ fontSize: 13.5, color: "var(--cor-primaria)", fontWeight: 600, margin: 0 }}>
        Obrigado pela sua avaliação!
      </p>
    );
  }

  const completo = notas.every((n) => n > 0);

  return (
    <form action={action} onSubmit={() => setEnviado(true)} style={{ display: "grid", gap: 14 }}>
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

      <button
        type="submit"
        disabled={!completo}
        style={{
          padding: "9px 16px",
          borderRadius: 8,
          border: "none",
          background: completo ? "var(--cor-primaria)" : "var(--cor-borda)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13.5,
          cursor: completo ? "pointer" : "not-allowed",
          justifySelf: "start",
        }}
      >
        {rotuloBotao}
      </button>
    </form>
  );
}
