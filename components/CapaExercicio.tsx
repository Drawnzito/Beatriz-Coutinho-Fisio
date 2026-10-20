import { ehImagemPassoAPasso } from "./PassoAPasso";
import styles from "./capaExercicio.module.css";

function extrairIdYoutube(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

/**
 * Imagem de capa de um exercício, preenchendo o espaço que o pai der.
 *
 * MiniaturaExercicio resolve o mesmo problema, mas é fixa em 90x90 e carrega
 * atalho pro passo a passo — serve pra linha de lista, não pro mosaico de
 * capa do treino, que precisa de uma imagem grande e de três pequenas sem
 * nada clicável dentro (o cartão inteiro já é um link).
 */
export function CapaExercicio({
  videoUrl,
  pdfUrl,
  titulo,
}: {
  videoUrl?: string | null;
  pdfUrl?: string | null;
  titulo?: string;
}) {
  const url = videoUrl ?? "";
  const semQuery = url.split("?")[0].toLowerCase();

  if (url && /\.(gif|png|jpe?g|webp)$/.test(semQuery)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={styles.imagem} />;
  }

  if (url && /\.(mp4|webm|mov|ogg)$/.test(semQuery)) {
    // Primeiro quadro do vídeo como capa: sem controles, sem autoplay.
    return <video src={url} muted playsInline preload="metadata" className={styles.imagem} />;
  }

  const idYoutube = url ? extrairIdYoutube(url) : null;
  if (idYoutube) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg`} alt="" className={styles.imagem} />;
  }

  if (pdfUrl && ehImagemPassoAPasso(pdfUrl)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={pdfUrl} alt="" className={styles.imagem} />;
  }

  const inicial = (titulo ?? "").trim().charAt(0).toUpperCase();
  return (
    <span className={styles.semMidia} aria-hidden="true">
      {inicial || "•"}
    </span>
  );
}
