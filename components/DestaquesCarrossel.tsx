"use client";

import { useEffect, useRef } from "react";

type Destaque = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  link_url: string | null;
};

const INTERVALO_MS = 3500;
const PAUSA_APOS_TOQUE_MS = 3000;

export function DestaquesCarrossel({ destaques }: { destaques: Destaque[] }) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const pausadoRef = useRef(false);
  const timeoutRetomarRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const trilho = trilhoRef.current;
    if (!trilho || destaques.length <= 1) return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzMovimento) return;

    const intervalo = setInterval(() => {
      if (pausadoRef.current) return;

      const card = trilho.firstElementChild as HTMLElement | null;
      const passo = (card?.clientWidth ?? 132) + 10;
      const fim = trilho.scrollWidth - trilho.clientWidth;

      if (trilho.scrollLeft >= fim - 5) {
        trilho.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        trilho.scrollTo({ left: trilho.scrollLeft + passo, behavior: "smooth" });
      }
    }, INTERVALO_MS);

    return () => clearInterval(intervalo);
  }, [destaques.length]);

  function pausar() {
    pausadoRef.current = true;
    clearTimeout(timeoutRetomarRef.current);
  }

  function retomarDaqui() {
    clearTimeout(timeoutRetomarRef.current);
    timeoutRetomarRef.current = setTimeout(() => {
      pausadoRef.current = false;
    }, PAUSA_APOS_TOQUE_MS);
  }

  if (destaques.length === 0) return null;

  return (
    <div
      ref={trilhoRef}
      onPointerDown={pausar}
      onPointerUp={retomarDaqui}
      onTouchStart={pausar}
      onTouchEnd={retomarDaqui}
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        margin: "0 0 32px",
        paddingBottom: 4,
      }}
    >
      {destaques.map((d) => {
        const conteudo = (
          <div
            style={{
              position: "relative",
              width: 132,
              height: 184,
              borderRadius: 14,
              overflow: "hidden",
              flexShrink: 0,
              scrollSnapAlign: "start",
              background: "var(--cor-borda)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.imagem_url}
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(22,63,60,.85), rgba(22,63,60,.05) 55%)",
              }}
            />
            <div style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
              <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>
                {d.titulo}
              </p>
              {d.subtitulo && (
                <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,.85)", fontSize: 11 }}>
                  {d.subtitulo}
                </p>
              )}
            </div>
          </div>
        );
        return d.link_url ? (
          <a key={d.id} href={d.link_url} target="_blank" rel="noopener noreferrer">
            {conteudo}
          </a>
        ) : (
          <div key={d.id}>{conteudo}</div>
        );
      })}
    </div>
  );
}
