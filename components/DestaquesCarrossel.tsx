"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Destaque = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string;
  link_url: string | null;
};

type Slide = Destaque & {
  /** Quando a arte já traz o texto desenhado, não sobrepomos nada. */
  textoNaArte?: boolean;
  /** Link interno do app (usa next/link em vez de <a> externo). */
  hrefInterno?: string;
};

const INTERVALO_MS = 5000;
const PAUSA_APOS_TOQUE_MS = 6000;

const SLIDE_INDICACAO: Slide = {
  id: "__indicacao",
  titulo: "Indique uma amiga",
  subtitulo: "50% na primeira sessão de pélvica domiciliar",
  imagem_url: "/marca/indique-uma-amiga.png",
  link_url: null,
  textoNaArte: true,
  hrefInterno: "/perfil?indicar=1",
};

export function DestaquesCarrossel({
  destaques,
  mostrarIndicacao = false,
}: {
  destaques: Destaque[];
  mostrarIndicacao?: boolean;
}) {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const pausadoRef = useRef(false);
  const timeoutRetomarRef = useRef<ReturnType<typeof setTimeout>>();
  const [atual, setAtual] = useState(0);

  // A indicação entra como primeiro slide: é a chamada que o Hugo quer que
  // todo mundo veja, independente de a Beatriz ter cadastrado destaques.
  const slides: Slide[] = mostrarIndicacao
    ? [SLIDE_INDICACAO, ...destaques]
    : destaques;

  const irPara = useCallback((indice: number) => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const alvo = trilho.children[indice] as HTMLElement | undefined;
    if (alvo) trilho.scrollTo({ left: alvo.offsetLeft, behavior: "smooth" });
  }, []);

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

  // Mantém os pontinhos em sincronia com o que está na tela, inclusive
  // quando a pessoa arrasta com o dedo.
  useEffect(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;

    function aoRolar() {
      const t = trilhoRef.current;
      if (!t) return;
      const largura = t.clientWidth || 1;
      setAtual(Math.round(t.scrollLeft / largura));
    }

    trilho.addEventListener("scroll", aoRolar, { passive: true });
    return () => trilho.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const intervalo = setInterval(() => {
      if (pausadoRef.current) return;
      const trilho = trilhoRef.current;
      if (!trilho) return;

      const largura = trilho.clientWidth || 1;
      const indice = Math.round(trilho.scrollLeft / largura);
      irPara(indice >= slides.length - 1 ? 0 : indice + 1);
    }, INTERVALO_MS);

    return () => clearInterval(intervalo);
  }, [slides.length, irPara]);

  if (slides.length === 0) return null;

  function navegar(passo: number) {
    pausar();
    retomarDaqui();
    const proximo = (atual + passo + slides.length) % slides.length;
    irPara(proximo);
  }

  return (
    <div style={{ position: "relative", margin: "0 0 30px" }}>
      <div
        ref={trilhoRef}
        className="destaque-trilho"
        onPointerDown={pausar}
        onPointerUp={retomarDaqui}
        onTouchStart={pausar}
        onTouchEnd={retomarDaqui}
      >
        {slides.map((slide) => {
          const miolo = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imagem_url}
                alt={slide.textoNaArte ? slide.titulo : ""}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {!slide.textoNaArte && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(22,63,60,.92), rgba(22,63,60,.25) 55%, rgba(22,63,60,0) 85%)",
                    }}
                  />
                  <div style={{ position: "absolute", left: 20, right: 20, bottom: 18 }}>
                    <p
                      style={{
                        margin: 0,
                        color: "#fff",
                        fontFamily: "var(--fonte-titulo)",
                        fontWeight: 700,
                        fontSize: 21,
                        lineHeight: 1.2,
                        textShadow: "0 1px 10px rgba(0,0,0,0.35)",
                      }}
                    >
                      {slide.titulo}
                    </p>
                    {slide.subtitulo && (
                      <p
                        style={{
                          margin: "5px 0 0",
                          color: "rgba(255,255,255,.92)",
                          fontSize: 13.5,
                          lineHeight: 1.35,
                        }}
                      >
                        {slide.subtitulo}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          );

          if (slide.hrefInterno) {
            return (
              <Link key={slide.id} href={slide.hrefInterno} className="destaque-slide">
                {miolo}
              </Link>
            );
          }

          if (slide.link_url) {
            return (
              <a
                key={slide.id}
                href={slide.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="destaque-slide"
              >
                {miolo}
              </a>
            );
          }

          return (
            <div key={slide.id} className="destaque-slide">
              {miolo}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Destaque anterior"
            className="destaque-seta"
            style={{ left: 10 }}
            onClick={() => navegar(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próximo destaque"
            className="destaque-seta"
            style={{ right: 10 }}
            onClick={() => navegar(1)}
          >
            ›
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 12 }}>
            {slides.map((slide, indice) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Ir para o destaque ${indice + 1}`}
                aria-current={indice === atual}
                onClick={() => {
                  pausar();
                  retomarDaqui();
                  irPara(indice);
                }}
                style={{
                  width: indice === atual ? 22 : 7,
                  height: 7,
                  padding: 0,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: indice === atual ? "var(--cor-primaria)" : "var(--cor-borda)",
                  transition: "width 0.2s ease, background 0.2s ease",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
