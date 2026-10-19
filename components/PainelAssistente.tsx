"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ASSISTENTE,
  GRUPOS_ASSISTENTE,
  PERGUNTAS_INICIAIS,
  acharPergunta,
  type AcaoAssistente,
} from "@/lib/assistente";
import { linkWhatsapp } from "@/lib/telefone";
import styles from "./assistente.module.css";

type Fala =
  | { de: "paciente"; texto: string }
  | { de: "assistente"; texto: string; acao?: AcaoAssistente };

/**
 * Painel da assistente. Carregado sob demanda por components/Assistente.tsx —
 * ver o comentário de lá sobre por que o conteúdo fica fora do pacote inicial.
 */
export function PainelAssistente({
  whatsapp,
  aoFechar,
  aoAbrirTour,
}: {
  whatsapp?: string | null;
  aoFechar: () => void;
  aoAbrirTour: () => void;
}) {
  const router = useRouter();
  const [falas, setFalas] = useState<Fala[]>([]);
  const [sugestoes, setSugestoes] = useState<string[]>(PERGUNTAS_INICIAIS);
  const [verTodas, setVerTodas] = useState(false);
  const [digitando, setDigitando] = useState(false);

  const fimDaConversa = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>();

  const numeroWhatsapp = (whatsapp ?? "").replace(/\D/g, "");

  // Evita deixar um "digitando" pendente se o painel fechar antes da resposta.
  useEffect(() => () => clearTimeout(temporizador.current), []);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [falas, digitando]);

  // Enquanto o painel está aberto, a página atrás não rola junto.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  function responder(id: string) {
    const item = acharPergunta(id);
    if (!item) return;

    setVerTodas(false);
    setFalas((atuais) => [...atuais, { de: "paciente", texto: item.pergunta }]);
    setSugestoes([]);
    setDigitando(true);

    // Pausa curta de propósito: a resposta aparecendo no mesmo quadro do toque
    // não dá tempo de perceber que ela respondeu alguma coisa.
    temporizador.current = setTimeout(() => {
      setDigitando(false);
      setFalas((atuais) => [...atuais, { de: "assistente", texto: item.resposta, acao: item.acao }]);
      setSugestoes(item.seguintes ?? PERGUNTAS_INICIAIS);
    }, 480);
  }

  function executar(acao: AcaoAssistente) {
    if (acao.tipo === "tour") {
      aoAbrirTour();
      return;
    }
    if (acao.tipo === "whatsapp") {
      window.open(linkWhatsapp(numeroWhatsapp), "_blank", "noopener");
      return;
    }
    if (acao.externo) {
      window.open(acao.href, "_blank", "noopener");
      return;
    }
    aoFechar();
    router.push(acao.href);
  }

  function rotuloDaAcao(acao: AcaoAssistente) {
    return acao.tipo === "tour" ? "Começar o passo a passo" : acao.rotulo;
  }

  return (
    <div className={styles.fundo} onClick={aoFechar}>
      <div
        className={styles.painel}
        role="dialog"
        aria-modal="true"
        aria-label={`${ASSISTENTE.nome}, ${ASSISTENTE.papel}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Cabeçalho ---------- */}
        <header className={styles.cabecalho}>
          <img src={ASSISTENTE.avatar} alt="" width={40} height={40} className={styles.cabecalhoFoto} />
          <div style={{ minWidth: 0 }}>
            <strong className={styles.cabecalhoNome}>{ASSISTENTE.nome}</strong>
            <span className={styles.cabecalhoPapel}>{ASSISTENTE.papel}</span>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className={styles.fechar}>
            ×
          </button>
        </header>

        {/* ---------- Conversa ---------- */}
        <div className={styles.conversa}>
          <Balao>{ASSISTENTE.saudacao}</Balao>

          {falas.map((fala, i) =>
            fala.de === "paciente" ? (
              <p key={i} className={styles.balaoPaciente}>
                {fala.texto}
              </p>
            ) : (
              <Balao
                key={i}
                acao={
                  fala.acao
                    ? { rotulo: rotuloDaAcao(fala.acao), aoTocar: () => executar(fala.acao!) }
                    : undefined
                }
                // Sem número cadastrado, o botão de WhatsApp não levaria a lugar nenhum.
                esconderAcao={fala.acao?.tipo === "whatsapp" && !numeroWhatsapp}
              >
                {fala.texto}
              </Balao>
            )
          )}

          {digitando && (
            <div className={styles.digitando} aria-label="escrevendo">
              <span /> <span /> <span />
            </div>
          )}

          <div ref={fimDaConversa} />
        </div>

        {/* ---------- Perguntas ---------- */}
        <div className={styles.rodape}>
          {verTodas ? (
            <div className={styles.listaTodas}>
              {GRUPOS_ASSISTENTE.map((grupo) => (
                <div key={grupo.titulo}>
                  <p className={styles.tituloGrupo}>{grupo.titulo}</p>
                  <div className={styles.chips}>
                    {grupo.ids.map((id) => (
                      <Chip key={id} id={id} aoTocar={responder} />
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setVerTodas(false)} className={styles.linkTexto}>
                ← voltar
              </button>
            </div>
          ) : (
            <>
              <div className={styles.chips}>
                {sugestoes.map((id) => (
                  <Chip key={id} id={id} aoTocar={responder} />
                ))}
              </div>
              {!digitando && (
                <button type="button" onClick={() => setVerTodas(true)} className={styles.linkTexto}>
                  Ver todas as perguntas
                </button>
              )}
            </>
          )}

          {numeroWhatsapp && <p className={styles.aviso}>{ASSISTENTE.rodape}</p>}
        </div>
      </div>
    </div>
  );
}

function Chip({ id, aoTocar }: { id: string; aoTocar: (id: string) => void }) {
  const item = acharPergunta(id);
  if (!item) return null;
  return (
    <button type="button" onClick={() => aoTocar(id)} className={styles.chip}>
      {item.pergunta}
    </button>
  );
}

function Balao({
  children,
  acao,
  esconderAcao,
}: {
  children: string;
  acao?: { rotulo: string; aoTocar: () => void };
  esconderAcao?: boolean;
}) {
  return (
    <div className={styles.linhaAssistente}>
      <img src={ASSISTENTE.avatar} alt="" width={26} height={26} className={styles.avatarPequeno} />
      <div className={styles.balaoAssistente}>
        {children.split("\n\n").map((paragrafo, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "8px 0 0" }}>
            {paragrafo}
          </p>
        ))}
        {acao && !esconderAcao && (
          <button type="button" onClick={acao.aoTocar} className={styles.botaoAcao}>
            {acao.rotulo}
          </button>
        )}
      </div>
    </div>
  );
}
