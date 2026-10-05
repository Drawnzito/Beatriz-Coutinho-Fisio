"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  extensaoDe,
  inferirContentType,
  TAMANHO_MAXIMO_MB,
} from "@/lib/tiposArquivo";

type Estado = "ocioso" | "enviando" | "pronto" | "erro";

/**
 * `crypto.randomUUID` só existe em contexto seguro e a partir do iOS 15.4.
 * Num iPhone mais antigo ele lança, a promessa do onChange rejeita e a tela
 * fica presa em "Enviando…" sem erro nenhum. O sufixo aleatório aqui não
 * precisa ser criptográfico — serve só pra não colidir nome de arquivo.
 */
/** Quadradinho de prévia do anexo já salvo. */
function PreviaAnexo({ url }: { url: string }) {
  const semQuery = url.split("?")[0].toLowerCase();
  const ehImagem = /\.(gif|png|jpe?g|webp|heic)$/.test(semQuery);
  const ehVideo = /\.(mp4|webm|mov|ogg)$/.test(semQuery);

  const caixa: React.CSSProperties = {
    width: 46,
    height: 46,
    borderRadius: 8,
    flexShrink: 0,
    objectFit: "cover",
    display: "block",
    background: "var(--cor-acento-suave)",
  };

  if (ehImagem) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="Anexo atual" style={caixa} />;
  }

  if (ehVideo) {
    return <video src={url} muted playsInline preload="metadata" style={{ ...caixa, background: "#000" }} />;
  }

  return (
    <span
      style={{
        ...caixa,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--cor-acento)",
        fontSize: 18,
      }}
    >
      📄
    </span>
  );
}

function identificadorUnico(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // cai no caminho de baixo
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Envia o arquivo direto do navegador pro Supabase Storage e devolve a URL
 * publica num input escondido, que o Server Action le depois.
 *
 * Por que nao mandar o arquivo junto com o formulario: Server Action do Next
 * aceita no maximo 1 MB de corpo por padrao (e a Vercel limita em 4,5 MB de
 * qualquer jeito), entao GIF de galeria estourava o limite e o upload falhava
 * calado. Indo direto pro Storage nao passa pelo servidor do app.
 *
 * O <input type="file"> vai de proposito SEM `accept`: varios seletores de
 * arquivo do Android/iOS escondem a galeria quando recebem uma lista de MIME
 * types, e era por isso que o GIF nem aparecia pra escolher. A validacao fica
 * por conta da extensao, aqui embaixo.
 */
export function UploadArquivo({
  nome,
  bucket,
  rotulo,
  ajuda,
  extensoes,
  urlAtual,
}: {
  nome: string;
  bucket: string;
  rotulo: string;
  ajuda?: string;
  extensoes: string[];
  /** Anexo já salvo, mostrado como prévia no formulário de edição. */
  urlAtual?: string | null;
}) {
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [mensagem, setMensagem] = useState("");
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const extensao = extensaoDe(arquivo.name, arquivo.type);

    if (!extensoes.includes(extensao)) {
      setEstado("erro");
      setMensagem(
        `Formato ${extensao ? `.${extensao}` : `"${arquivo.type || "desconhecido"}"`} não aceito aqui. ` +
          `Use: ${extensoes.join(", ")}.`
      );
      setUrl("");
      return;
    }

    const tamanhoMb = arquivo.size / (1024 * 1024);
    if (tamanhoMb > TAMANHO_MAXIMO_MB) {
      setEstado("erro");
      setMensagem(
        `Arquivo tem ${tamanhoMb.toFixed(1)} MB e o limite é ${TAMANHO_MAXIMO_MB} MB. Tente um vídeo mais curto.`
      );
      setUrl("");
      return;
    }

    setEstado("enviando");
    setMensagem(`Enviando ${arquivo.name}…`);
    setUrl("");

    // try/catch em volta de tudo: qualquer falha inesperada (API do navegador
    // que não existe, rede caindo no meio) precisa virar mensagem na tela em
    // vez de deixar o campo preso em "Enviando…" pra sempre.
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEstado("erro");
        setMensagem("Sua sessão expirou. Recarregue a página e entre de novo.");
        return;
      }

      const caminho = `${user.id}/${identificadorUnico()}.${extensao}`;
      const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
        contentType: inferirContentType(arquivo.name, arquivo.type),
        upsert: false,
      });

      if (error) {
        setEstado("erro");
        setMensagem(`Não consegui enviar: ${error.message}`);
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
      setUrl(data.publicUrl);
      setEstado("pronto");
      setMensagem(`${arquivo.name} enviado.`);
    } catch (erro) {
      setEstado("erro");
      setMensagem(`Falhou no envio: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  }

  function limpar() {
    setUrl("");
    setEstado("ocioso");
    setMensagem("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>{rotulo}</label>

      {/* Mostra o que já está salvo: antes o campo vinha vazio na edição e
          parecia que o anexo tinha sumido (ele era mantido, mas sem aviso). */}
      {urlAtual && estado !== "pronto" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 8,
            borderRadius: 10,
            background: "var(--cor-fundo)",
            border: "1px solid var(--cor-borda)",
          }}
        >
          <PreviaAnexo url={urlAtual} />
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 12, color: "var(--cor-primaria)" }}>
              Anexo atual
            </strong>
            <span style={{ fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
              Continua salvo se você não escolher outro.
            </span>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        onChange={aoEscolher}
        disabled={estado === "enviando"}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--cor-borda)",
          background: "var(--cor-superficie)",
          fontSize: 14,
          fontFamily: "var(--fonte-corpo)",
          width: "100%",
        }}
      />

      {/* O que o Server Action realmente le */}
      <input type="hidden" name={nome} value={url} />

      {ajuda && estado === "ocioso" && (
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)" }}>{ajuda}</p>
      )}

      {estado !== "ocioso" && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color:
              estado === "erro"
                ? "#a2334a"
                : estado === "pronto"
                ? "var(--cor-primaria)"
                : "var(--cor-texto-suave)",
          }}
        >
          {estado === "enviando" && "⏳ "}
          {estado === "pronto" && "✓ "}
          {estado === "erro" && "⚠ "}
          {mensagem}
          {estado !== "enviando" && (
            <button
              type="button"
              onClick={limpar}
              style={{
                marginLeft: 8,
                background: "none",
                border: "none",
                color: "var(--cor-acento)",
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              trocar
            </button>
          )}
        </p>
      )}

      {estado === "enviando" && (
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
          Não salve ainda — espere terminar o envio.
        </p>
      )}
    </div>
  );
}
