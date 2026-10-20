"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extensaoDe, TAMANHO_MAXIMO_MB } from "@/lib/tiposArquivo";
import styles from "./uploadImagemRecortada.module.css";

type Estado = "ocioso" | "recortando" | "enviando" | "pronto" | "erro";

/** Larguras máximas de saída: foto de celular moderna é grande demais pro que a tela usa. */
const LARGURA_MAXIMA = 1600;

const PROPORCOES = [
  { rotulo: "Paisagem", valor: 16 / 10 },
  { rotulo: "Clássico", valor: 4 / 3 },
  { rotulo: "Quadrado", valor: 1 },
  { rotulo: "Retrato", valor: 4 / 5 },
  { rotulo: "Story", valor: 9 / 16 },
];

function identificadorUnico(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // iPhone antigo / contexto não seguro: cai no sufixo abaixo
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Upload de imagem com recorte antes de enviar.
 *
 * O destaque mostrava a foto na proporção em que ela foi tirada, e enquadrar
 * virava trabalho de editar a foto fora do app antes de subir. Aqui a Beatriz
 * escolhe o formato, arrasta e aproxima — o que sai já é a imagem final, e não
 * um recorte feito na exibição.
 *
 * GIF passa direto, sem recorte: redesenhar num canvas devolveria só o
 * primeiro quadro e mataria a animação.
 */
export function UploadImagemRecortada({
  nome,
  bucket,
  rotulo,
  ajuda,
  urlAtual,
}: {
  nome: string;
  bucket: string;
  rotulo: string;
  ajuda?: string;
  urlAtual?: string | null;
}) {
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [mensagem, setMensagem] = useState("");
  const [url, setUrl] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [fonte, setFonte] = useState<string>("");
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);

  const [proporcao, setProporcao] = useState(16 / 10);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const molduraRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const arrasto = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Object URL vive enquanto o recorte está aberto; sem revogar, cada foto
  // escolhida deixaria um blob preso na memória da aba.
  useEffect(() => {
    if (!fonte) return;
    return () => URL.revokeObjectURL(fonte);
  }, [fonte]);

  useEffect(() => {
    if (estado !== "recortando") return;
    function medir() {
      if (molduraRef.current) setLargura(molduraRef.current.clientWidth);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [estado]);

  const altura = largura / proporcao;
  const escalaBase =
    imagem && largura ? Math.max(largura / imagem.naturalWidth, altura / imagem.naturalHeight) : 1;
  const escala = escalaBase * zoom;
  const larguraRender = imagem ? imagem.naturalWidth * escala : 0;
  const alturaRender = imagem ? imagem.naturalHeight * escala : 0;

  function limitar(p: { x: number; y: number }) {
    return {
      x: Math.min(0, Math.max(largura - larguraRender, p.x)),
      y: Math.min(0, Math.max(altura - alturaRender, p.y)),
    };
  }

  // Centraliza ao trocar de formato ou de zoom: o recorte nunca fica com
  // faixa vazia de um lado.
  useEffect(() => {
    if (!imagem || !largura) return;
    setPos((atual) => limitar(atual));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proporcao, zoom, largura, imagem]);

  function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const escolhido = evento.target.files?.[0];
    if (!escolhido) return;

    const extensao = extensaoDe(escolhido.name, escolhido.type);
    if (!["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(extensao)) {
      setEstado("erro");
      setMensagem(`Isso não parece uma imagem (.${extensao || "?"}). Use JPG, PNG, WEBP ou GIF.`);
      return;
    }

    const tamanhoMb = escolhido.size / (1024 * 1024);
    if (tamanhoMb > TAMANHO_MAXIMO_MB) {
      setEstado("erro");
      setMensagem(`A imagem tem ${tamanhoMb.toFixed(1)} MB e o limite é ${TAMANHO_MAXIMO_MB} MB.`);
      return;
    }

    if (extensao === "gif") {
      enviar(escolhido, escolhido.name);
      return;
    }

    const objeto = URL.createObjectURL(escolhido);
    const img = new Image();
    img.onload = () => {
      setImagem(img);
      setArquivo(escolhido);
      setFonte(objeto);
      setZoom(1);
      setPos({ x: 0, y: 0 });
      setEstado("recortando");
      setMensagem("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(objeto);
      setEstado("erro");
      setMensagem("Não consegui abrir essa imagem. Tente outra.");
    };
    img.src = objeto;
  }

  function aoPressionar(evento: React.PointerEvent<HTMLDivElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arrasto.current = { x: evento.clientX, y: evento.clientY, px: pos.x, py: pos.y };
  }

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    if (!arrasto.current) return;
    const { x, y, px, py } = arrasto.current;
    setPos(limitar({ x: px + (evento.clientX - x), y: py + (evento.clientY - y) }));
  }

  function aoSoltar() {
    arrasto.current = null;
  }

  async function confirmarRecorte() {
    if (!imagem || !arquivo || !largura) return;

    const larguraFonte = largura / escala;
    const alturaFonte = altura / escala;
    const saidaLargura = Math.round(Math.min(LARGURA_MAXIMA, larguraFonte));
    const saidaAltura = Math.round(saidaLargura / proporcao);

    const canvas = document.createElement("canvas");
    canvas.width = saidaLargura;
    canvas.height = saidaAltura;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setEstado("erro");
      setMensagem("Este navegador não conseguiu preparar o recorte.");
      return;
    }

    ctx.drawImage(
      imagem,
      -pos.x / escala,
      -pos.y / escala,
      larguraFonte,
      alturaFonte,
      0,
      0,
      saidaLargura,
      saidaAltura
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.88)
    );

    if (!blob) {
      setEstado("erro");
      setMensagem("Não consegui gerar a imagem recortada.");
      return;
    }

    const base = arquivo.name.replace(/\.[^.]+$/, "");
    await enviar(new File([blob], `${base}.jpg`, { type: "image/jpeg" }), `${base}.jpg`);
  }

  async function enviar(paraEnviar: File, nomeExibido: string) {
    setEstado("enviando");
    setMensagem(`Enviando ${nomeExibido}…`);

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

      const extensao = extensaoDe(paraEnviar.name, paraEnviar.type) || "jpg";
      const caminho = `${user.id}/${identificadorUnico()}.${extensao}`;
      const { error } = await supabase.storage.from(bucket).upload(caminho, paraEnviar, {
        contentType: paraEnviar.type || "image/jpeg",
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
      setMensagem("Imagem enviada.");
    } catch (erro) {
      setEstado("erro");
      setMensagem(`Falhou no envio: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  }

  function limpar() {
    setUrl("");
    setArquivo(null);
    setImagem(null);
    setFonte("");
    setEstado("ocioso");
    setMensagem("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>{rotulo}</label>

      {urlAtual && estado !== "pronto" && estado !== "recortando" && (
        <div className={styles.atual}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlAtual} alt="Imagem atual" className={styles.atualFoto} />
          <div>
            <strong className={styles.atualTitulo}>Imagem atual</strong>
            <span className={styles.ajuda}>Continua salva se você não escolher outra.</span>
          </div>
        </div>
      )}

      {estado !== "recortando" && (
        <input ref={inputRef} type="file" onChange={aoEscolher} disabled={estado === "enviando"} className={styles.campoArquivo} />
      )}

      {/* O que o Server Action realmente lê */}
      <input type="hidden" name={nome} value={url} />

      {estado === "recortando" && imagem && (
        <div className={styles.editor}>
          <div className={styles.formatos}>
            {PROPORCOES.map((p) => (
              <button
                key={p.rotulo}
                type="button"
                onClick={() => setProporcao(p.valor)}
                className={`${styles.formato} ${proporcao === p.valor ? styles.formatoAtivo : ""}`}
              >
                {p.rotulo}
              </button>
            ))}
          </div>

          <div
            ref={molduraRef}
            className={styles.moldura}
            style={{ aspectRatio: String(proporcao) }}
            onPointerDown={aoPressionar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fonte}
              alt=""
              draggable={false}
              className={styles.imagem}
              style={{
                width: larguraRender,
                height: alturaRender,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
            />
            <span className={styles.grade} aria-hidden="true" />
          </div>

          <label className={styles.zoom}>
            <span className={styles.ajuda}>Aproximar</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>

          <p className={styles.ajuda}>Arraste a imagem pra escolher o que aparece.</p>

          <div className={styles.acoes}>
            <button type="button" onClick={confirmarRecorte} className={styles.botaoPrimario}>
              Usar este recorte
            </button>
            <button type="button" onClick={limpar} className={styles.botaoTexto}>
              escolher outra
            </button>
          </div>
        </div>
      )}

      {ajuda && estado === "ocioso" && <p className={styles.ajuda}>{ajuda}</p>}

      {(estado === "enviando" || estado === "pronto" || estado === "erro") && (
        <p className={`${styles.aviso} ${estado === "erro" ? styles.avisoErro : estado === "pronto" ? styles.avisoOk : ""}`}>
          {estado === "enviando" && "⏳ "}
          {estado === "pronto" && "✓ "}
          {estado === "erro" && "⚠ "}
          {mensagem}
          {estado !== "enviando" && (
            <button type="button" onClick={limpar} className={styles.trocar}>
              trocar
            </button>
          )}
        </p>
      )}

      {estado === "enviando" && <p className={styles.ajuda}>Não salve ainda — espere terminar o envio.</p>}
    </div>
  );
}
