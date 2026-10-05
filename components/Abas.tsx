"use client";

import { useState } from "react";

export function Abas({
  abas,
  inicial,
}: {
  abas: {
    id: string;
    rotulo: string;
    conteudo: React.ReactNode;
    /** Quantidade de itens esperando ação. Zero ou ausente não mostra nada. */
    pendencias?: number;
  }[];
  inicial?: string;
}) {
  const [ativa, setAtiva] = useState(inicial && abas.some((a) => a.id === inicial) ? inicial : abas[0]?.id);

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          borderBottom: "1px solid var(--cor-borda)",
          position: "sticky",
          top: 0,
          background: "var(--cor-fundo)",
          zIndex: 10,
        }}
      >
        {abas.map((a) => {
          const selecionada = a.id === ativa;
          return (
            <button
              key={a.id}
              role="tab"
              aria-selected={selecionada}
              onClick={() => setAtiva(a.id)}
              style={{
                appearance: "none",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: "14px 12px",
                fontFamily: "var(--fonte-corpo)",
                fontSize: 13.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: selecionada ? "var(--cor-primaria-escura)" : "var(--cor-texto-suave)",
                borderBottom: selecionada ? "2px solid var(--cor-primaria)" : "2px solid transparent",
                marginBottom: -1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {a.rotulo}
              {!!a.pendencias && a.pendencias > 0 && (
                <span
                  aria-label={`${a.pendencias} aguardando você`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 19,
                    height: 19,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "var(--cor-acento)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {a.pendencias > 99 ? "99+" : a.pendencias}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {abas.map((a) => (
        <div key={a.id} hidden={a.id !== ativa}>
          {a.conteudo}
        </div>
      ))}
    </div>
  );
}
