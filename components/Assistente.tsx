"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ASSISTENTE_IDENTIDADE } from "@/lib/assistenteIdentidade";
import { GuiaPrimeirosPassos } from "./GuiaPrimeirosPassos";
import styles from "./assistente.module.css";

/* O painel (e com ele todas as perguntas e respostas) só é baixado quando
   alguém toca na bolha — do contrário pesaria no carregamento de toda visita
   a /inicio e /exercicios sem ser usado. */
const PainelAssistente = dynamic(() => import("./PainelAssistente").then((m) => m.PainelAssistente), {
  ssr: false,
});

const CHAVE_DISPENSADO = "assistente-dispensado";

/**
 * Assistente do app: uma FAQ guiada com cara de conversa.
 *
 * Não existe chamada a serviço nenhum aqui — as respostas estão escritas em
 * lib/assistente.ts e a paciente só escolhe entre perguntas prontas. Era o
 * requisito: ajuda imediata, custo zero e nenhuma resposta inventada sobre
 * tratamento.
 *
 * Substituiu o antigo atalho "Primeiros passos", que disputava o mesmo canto
 * da tela — o tour agora é uma das perguntas daqui.
 */
export function Assistente({ whatsapp }: { whatsapp?: string | null }) {
  const [estado, setEstado] = useState<"carregando" | "visivel" | "oculto">("carregando");
  const [aberto, setAberto] = useState(false);
  const [tourAberto, setTourAberto] = useState(false);

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
      // sem armazenamento disponível: some só nesta visita
    }
    setEstado("oculto");
  }

  if (tourAberto) {
    return <GuiaPrimeirosPassos onFechar={() => setTourAberto(false)} />;
  }

  if (estado !== "visivel") return null;

  if (aberto) {
    return (
      <PainelAssistente
        whatsapp={whatsapp}
        aoFechar={() => setAberto(false)}
        aoAbrirTour={() => {
          setAberto(false);
          setTourAberto(true);
        }}
      />
    );
  }

  return (
    <div className={styles.cantoFlutuante}>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Abrir ${ASSISTENTE_IDENTIDADE.nome}, ${ASSISTENTE_IDENTIDADE.papel}`}
        className={styles.bolha}
      >
        <img src={ASSISTENTE_IDENTIDADE.avatar} alt="" width={54} height={54} className={styles.bolhaFoto} />
        <span className={styles.selo}>?</span>
      </button>

      <button
        type="button"
        onClick={dispensar}
        aria-label="Não mostrar mais a assistente"
        title="Não mostrar mais"
        className={styles.fechaBolha}
      >
        ×
      </button>
    </div>
  );
}
