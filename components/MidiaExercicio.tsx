function extrairIdYoutube(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  return match ? match[1] : null;
}

export function MidiaExercicio({ url }: { url: string }) {
  const semQuery = url.split("?")[0].toLowerCase();

  if (/\.(gif|png|jpe?g|webp)$/.test(semQuery)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Demonstração do exercício"
        style={{ width: "100%", borderRadius: 10, display: "block" }}
      />
    );
  }

  if (/\.(mp4|webm|mov|ogg)$/.test(semQuery)) {
    return (
      <video
        src={url}
        controls
        playsInline
        style={{ width: "100%", borderRadius: 10, display: "block", background: "#000" }}
      />
    );
  }

  const idYoutube = extrairIdYoutube(url);
  if (idYoutube) {
    return (
      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 10, overflow: "hidden" }}>
        <iframe
          src={`https://www.youtube.com/embed/${idYoutube}`}
          title="Vídeo de demonstração"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ fontSize: 13, color: "var(--cor-acento)" }}
    >
      Ver vídeo de demonstração →
    </a>
  );
}
