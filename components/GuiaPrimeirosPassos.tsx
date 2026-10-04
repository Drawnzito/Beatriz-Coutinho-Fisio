"use client";

import { useEffect, useState } from "react";

const PASSOS = [
  {
    alvo: "agenda",
    titulo: "Sua agenda",
    texto: "Aqui você vê suas sessões da semana. Toque em qualquer dia pra ver os detalhes.",
  },
  {
    alvo: "solicitar",
    titulo: "Solicitar sessão",
    texto: "Precisa de uma nova sessão? Toque aqui — a Beatriz aprova antes de ficar confirmada.",
  },
  {
    alvo: "nav-exercicios",
    titulo: "Seus exercícios",
    texto: "Aqui ficam os treinos que a Beatriz montou pra você, com vídeo ou gif de demonstração.",
  },
  {
    alvo: "nav-perfil",
    titulo: "Fale com a Beatriz",
    texto: "Aqui você encontra o WhatsApp da clínica, o endereço do consultório e seus dados.",
  },
];

type Retangulo = { top: number; left: number; width: number; height: number };

export function GuiaPrimeirosPassos({ onFechar }: { onFechar?: () => void | Promise<void> }) {
  const [visivel, setVisivel] = useState(true);
  const [passo, setPasso] = useState(0);
  const [retangulo, setRetangulo] = useState<Retangulo | null>(null);

  async function fechar() {
    setVisivel(false);
    await onFechar?.();
  }

  useEffect(() => {
    if (!visivel) return;

    const elemento = document.querySelector(`[data-tour="${PASSOS[passo].alvo}"]`);

    // Essa etapa não existe na tela atual (ex: "agenda"/"solicitar" quando o
    // guia é reaberto a partir do Perfil) — pula direto pra próxima em vez de
    // mostrar uma etapa sem nada pra destacar.
    if (!elemento) {
      if (passo + 1 >= PASSOS.length) {
        fechar();
      } else {
        setPasso(passo + 1);
      }
      return;
    }

    elemento.scrollIntoView({ block: "center", behavior: "smooth" });

    let ativo = true;
    let quadro: number;

    function medir() {
      if (!ativo) return;
      const el = document.querySelector(`[data-tour="${PASSOS[passo].alvo}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setRetangulo({
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        });
      }
      quadro = requestAnimationFrame(medir);
    }

    quadro = requestAnimationFrame(medir);

    return () => {
      ativo = false;
      cancelAnimationFrame(quadro);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, visivel]);

  if (!visivel) return null;

  const ultimo = passo === PASSOS.length - 1;
  const atual = PASSOS[passo];

  const tooltipEmbaixo = retangulo ? retangulo.top < window.innerHeight / 2 : true;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      {retangulo ? (
        <div
          style={{
            position: "fixed",
            top: retangulo.top,
            left: retangulo.left,
            width: retangulo.width,
            height: retangulo.height,
            borderRadius: 14,
            boxShadow: "0 0 0 9999px rgba(12, 28, 26, 0.72)",
            border: "2px solid #fff",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 28, 26, 0.72)",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          ...(retangulo
            ? tooltipEmbaixo
              ? { top: Math.min(retangulo.top + retangulo.height + 14, window.innerHeight - 220) }
              : { top: Math.max(retangulo.top - 180, 16) }
            : { top: "50%", marginTop: -90 }),
          width: "calc(100% - 40px)",
          maxWidth: 360,
          display: "grid",
          gap: 10,
          padding: "16px 18px",
          borderRadius: 14,
          background: "var(--cor-superficie)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {PASSOS.map((_, i) => (
            <span
              key={i}
              style={{
                height: 5,
                flex: 1,
                borderRadius: 999,
                background: i <= passo ? "var(--cor-primaria)" : "var(--cor-borda)",
                transition: "background 0.2s ease",
              }}
            />
          ))}
        </div>

        <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 16, color: "var(--cor-primaria)" }}>
          {atual.titulo}
        </strong>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--cor-texto)" }}>{atual.texto}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <button type="button" onClick={fechar} style={botaoPular}>
            Pular
          </button>
          <button
            type="button"
            onClick={() => (ultimo ? fechar() : setPasso((p) => p + 1))}
            style={botaoProximo}
          >
            {ultimo ? "Entendi" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}

const botaoPular: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-texto-suave)",
  fontSize: 13,
  cursor: "pointer",
};

const botaoProximo: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 999,
  border: "none",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13.5,
  cursor: "pointer",
};
