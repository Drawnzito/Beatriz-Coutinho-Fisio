"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MidiaExercicio } from "@/components/MidiaExercicio";

type Item = {
  id: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  series: number | null;
  repeticoes: number | null;
};

const DESCANSO_PADRAO = 45;

function tocarSomConclusao() {
  try {
    const AudioContextClasse = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClasse();
    const tocarNota = (freq: number, inicio: number, duracao: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + inicio);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + inicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + duracao);
    };
    tocarNota(587.33, 0, 0.22);
    tocarNota(783.99, 0.16, 0.34);
  } catch {
    // navegador sem suporte a Web Audio — segue sem som
  }
}

export function TreinoExecucao({ tituloPlano, itens }: { tituloPlano: string; itens: Item[] }) {
  const [indice, setIndice] = useState(0);
  const [fase, setFase] = useState<"exercicio" | "descanso" | "concluido">("exercicio");
  const [tempoRestante, setTempoRestante] = useState(DESCANSO_PADRAO);
  const [duracaoDescanso, setDuracaoDescanso] = useState(DESCANSO_PADRAO);

  const ultimo = indice >= itens.length - 1;

  useEffect(() => {
    if (fase !== "concluido") return;
    if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 320]);
    tocarSomConclusao();
  }, [fase]);

  useEffect(() => {
    if (fase !== "descanso") return;
    if (tempoRestante <= 0) {
      setIndice((i) => i + 1);
      setFase("exercicio");
      return;
    }
    const t = setTimeout(() => setTempoRestante((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [fase, tempoRestante]);

  function concluirExercicio() {
    if (ultimo) {
      setFase("concluido");
    } else {
      setTempoRestante(duracaoDescanso);
      setFase("descanso");
    }
  }

  function ajustarDescanso(delta: number) {
    setDuracaoDescanso((d) => Math.max(15, d + delta));
    setTempoRestante((t) => Math.max(0, t + delta));
  }

  function pularDescanso() {
    setIndice((i) => i + 1);
    setFase("exercicio");
  }

  if (itens.length === 0) {
    return (
      <main style={pagina}>
        <p style={{ color: "var(--cor-texto-suave)" }}>Esse plano não tem exercícios ainda.</p>
        <Link href="/exercicios" style={linkVoltar}>← voltar</Link>
      </main>
    );
  }

  if (fase === "concluido") {
    return (
      <main style={{ ...pagina, alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h1 style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria-escura)", fontSize: 24, margin: "12px 0 6px" }}>
          Treino concluído!
        </h1>
        <p style={{ color: "var(--cor-texto-suave)", fontSize: 14, marginBottom: 28 }}>
          {tituloPlano} · {itens.length} exercício{itens.length > 1 ? "s" : ""}
        </p>
        <Link href="/exercicios" style={botaoPrimarioLink}>Voltar aos exercícios</Link>
      </main>
    );
  }

  if (fase === "descanso") {
    return (
      <main style={{ ...pagina, alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "100vh" }}>
        <p style={{ fontSize: 13, letterSpacing: 2, color: "var(--cor-acento)", fontWeight: 700, margin: "0 0 8px" }}>
          DESCANSO
        </p>
        <div style={{ fontFamily: "var(--fonte-titulo)", fontSize: 64, color: "var(--cor-primaria-escura)", fontWeight: 700 }}>
          {tempoRestante}s
        </div>
        <p style={{ color: "var(--cor-texto-suave)", fontSize: 14, margin: "8px 0 28px" }}>
          Próximo: {itens[indice + 1]?.titulo}
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={() => ajustarDescanso(-15)} style={botaoChip}>-15s</button>
          <button onClick={() => ajustarDescanso(15)} style={botaoChip}>+15s</button>
        </div>
        <button onClick={pularDescanso} style={botaoTexto}>pular descanso</button>
      </main>
    );
  }

  const item = itens[indice];

  return (
    <main style={pagina}>
      <Link href="/exercicios" style={linkVoltar}>← sair do treino</Link>

      <div style={{ height: 4, background: "var(--cor-borda)", borderRadius: 2, margin: "16px 0 6px" }}>
        <div
          style={{
            height: 4,
            width: `${(indice / itens.length) * 100}%`,
            background: "var(--cor-primaria)",
            borderRadius: 2,
            transition: "width .3s ease",
          }}
        />
      </div>
      <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: "0 0 20px" }}>
        Exercício {indice + 1} de {itens.length}
      </p>

      <h1 style={{ fontFamily: "var(--fonte-titulo)", fontSize: 22, color: "var(--cor-primaria-escura)", margin: "0 0 6px" }}>
        {item.titulo}
      </h1>
      <p style={{ fontSize: 14, color: "var(--cor-texto-suave)", margin: "0 0 16px" }}>
        {item.series ?? "-"} séries × {item.repeticoes ?? "-"} repetições
      </p>

      {item.video_url && (
        <div style={{ marginBottom: 16 }}>
          <MidiaExercicio url={item.video_url} />
        </div>
      )}

      {item.descricao && (
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>{item.descricao}</p>
      )}

      <button onClick={concluirExercicio} style={botaoPrimario}>
        {ultimo ? "Concluir treino" : "Concluir exercício"}
      </button>
    </main>
  );
}

const pagina: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  maxWidth: 480,
  margin: "0 auto",
  padding: "24px 20px 60px",
};

const linkVoltar: React.CSSProperties = {
  fontSize: 13,
  color: "var(--cor-texto-suave)",
  textDecoration: "none",
};

const botaoPrimario: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: 10,
  border: "none",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

const botaoPrimarioLink: React.CSSProperties = {
  ...botaoPrimario,
  textDecoration: "none",
  display: "inline-block",
};

const botaoChip: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const botaoTexto: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-acento)",
  fontSize: 13,
  cursor: "pointer",
};
