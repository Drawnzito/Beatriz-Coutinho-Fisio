function extrairIdYoutube(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return match ? match[1] : null;
}

function BadgePdf({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginTop: 6,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--cor-acento)",
        textDecoration: "none",
      }}
    >
      📄 PDF passo a passo
    </a>
  );
}

export function MidiaExercicio({
  url,
  previa = false,
  pdfUrl,
}: {
  url: string;
  previa?: boolean;
  pdfUrl?: string | null;
}) {
  const semQuery = url.split("?")[0].toLowerCase();

  let conteudo: React.ReactNode;

  if (/\.(gif|png|jpe?g|webp)$/.test(semQuery)) {
    conteudo = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Demonstração do exercício"
        style={
          previa
            ? { height: 90, width: 90, borderRadius: 10, display: "block", objectFit: "cover" }
            : { width: "100%", borderRadius: 10, display: "block" }
        }
      />
    );
  } else if (/\.(mp4|webm|mov|ogg)$/.test(semQuery)) {
    conteudo = previa ? (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        style={{ height: 90, width: 90, borderRadius: 10, display: "block", background: "#000", objectFit: "cover" }}
      />
    ) : (
      <video
        src={url}
        controls
        playsInline
        style={{ width: "100%", borderRadius: 10, display: "block", background: "#000" }}
      />
    );
  } else {
    const idYoutube = extrairIdYoutube(url);
    if (idYoutube) {
      conteudo = previa ? (
        <div style={{ position: "relative", width: 90, height: 90, borderRadius: 10, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg`}
            alt="Prévia do vídeo de demonstração"
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            <span style={{ fontSize: 20, color: "#fff" }}>▶</span>
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 10, overflow: "hidden" }}>
          <iframe
            src={`https://www.youtube.com/embed/${idYoutube}`}
            title="Vídeo de demonstração"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      );
    } else {
      conteudo = (
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--cor-acento)" }}>
          Ver vídeo de demonstração →
        </a>
      );
    }
  }

  if (!previa || !pdfUrl) return <>{conteudo}</>;

  return (
    <div>
      {conteudo}
      <BadgePdf url={pdfUrl} />
    </div>
  );
}
