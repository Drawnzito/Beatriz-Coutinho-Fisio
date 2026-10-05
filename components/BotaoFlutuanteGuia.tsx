"use client";

import { useEffect, useState } from "react";
import { GuiaPrimeirosPassos } from "./GuiaPrimeirosPassos";

const CHAVE_DISPENSADO = "guia-flutuante-dispensado";

/**
 * Atalho flutuante pro guia de primeiros passos.
 *
 * Fica sempre à vista, mas com um X: quem já sabe usar o app dispensa e não
 * vê mais. Quem dispensou ainda alcança o guia pelo Perfil — por isso o X
 * some com o botão, e não com o guia.
 */
export function BotaoFlutuanteGuia() {
  const [estado, setEstado] = useState<"carregando" | "visivel" | "oculto">("carregando");
  const [guiaAberto, setGuiaAberto] = useState(false);

  useEffect(() => {
    try {
      setEstado(localStorage.getItem(CHAVE_DISPENSADO) ? "oculto" : "visivel");
    } catch {
      setEstado("visivel");
    }
  }, []);

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      // sem armazenamento, some só nesta visita
    }
    setEstado("oculto");
  }

  if (guiaAberto) {
    return <GuiaPrimeirosPassos onFechar={() => setGuiaAberto(false)} />;
  }

  if (estado !== "visivel") return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 14,
        // Acima da barra de navegação do celular, pra não cobrir um item dela.
        bottom: "calc(76px + env(safe-area-inset-bottom))",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <button
        type="button"
        onClick={() => setGuiaAberto(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 16px",
          borderRadius: 999,
          border: "none",
          background: "var(--cor-primaria)",
          color: "#fff",
          fontFamily: "var(--fonte-corpo)",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          boxShadow: "0 10px 26px -10px rgba(22,63,60,0.85)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        Primeiros passos
      </button>

      <button
        type="button"
        onClick={dispensar}
        aria-label="Não mostrar mais este atalho"
        title="Não mostrar mais"
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "1px solid var(--cor-borda)",
          background: "var(--cor-superficie)",
          color: "var(--cor-texto-suave)",
          fontSize: 14,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 12px -4px rgba(22,63,60,0.4)",
        }}
      >
        ×
      </button>
    </div>
  );
}
