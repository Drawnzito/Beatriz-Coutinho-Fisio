import { MidiaExercicio } from "./MidiaExercicio";

const LADO = 90;

/**
 * Miniatura do exercício que SEMPRE ocupa o mesmo espaço.
 *
 * Antes a miniatura só era renderizada quando havia vídeo/gif: exercício sem
 * mídia ficava com o texto colado na borda e desalinhado dos vizinhos. Agora,
 * sem mídia, entra um bloco da marca no mesmo tamanho — se houver PDF, ele
 * vira o atalho pro PDF em vez de um espaço morto.
 */
export function MiniaturaExercicio({
  videoUrl,
  pdfUrl,
  titulo,
}: {
  videoUrl?: string | null;
  pdfUrl?: string | null;
  titulo?: string;
}) {
  if (videoUrl) {
    return <MidiaExercicio url={videoUrl} previa pdfUrl={pdfUrl} />;
  }

  const inicial = (titulo ?? "").trim().charAt(0).toUpperCase();

  const bloco = (
    <div
      aria-hidden={!pdfUrl}
      style={{
        width: LADO,
        height: LADO,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: "linear-gradient(140deg, var(--cor-acento-suave), var(--cor-fundo))",
        border: "1px solid var(--cor-borda)",
        color: pdfUrl ? "var(--cor-acento)" : "var(--cor-primaria)",
      }}
    >
      {pdfUrl ? (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3 }}>PASSO A PASSO</span>
        </>
      ) : inicial ? (
        <span
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: 30,
            fontWeight: 700,
            opacity: 0.55,
            lineHeight: 1,
          }}
        >
          {inicial}
        </span>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" opacity="0.5">
          <path d="M6.5 6.5 4 4M17.5 6.5 20 4M6.5 17.5 4 20M17.5 17.5 20 20" />
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      )}
    </div>
  );

  if (!pdfUrl) return bloco;

  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noreferrer"
      title="Abrir o PDF passo a passo"
      style={{ display: "block", textDecoration: "none" }}
    >
      {bloco}
    </a>
  );
}
