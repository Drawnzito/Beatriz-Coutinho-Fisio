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
}: {
  nome: string;
  bucket: string;
  rotulo: string;
  ajuda?: string;
  extensoes: string[];
}) {
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [mensagem, setMensagem] = useState("");
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const extensao = extensaoDe(arquivo.name);

    if (!extensoes.includes(extensao)) {
      setEstado("erro");
      setMensagem(`Formato .${extensao || "?"} não aceito aqui. Use: ${extensoes.join(", ")}.`);
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

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setEstado("erro");
      setMensagem("Sua sessão expirou. Recarregue a página e entre de novo.");
      return;
    }

    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;
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
