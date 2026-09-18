"use client";

export function Header({
  titulo,
  subtitulo,
  avatarUrl,
}: {
  titulo: string;
  subtitulo?: string;
  avatarUrl?: string | null;
}) {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--cor-borda)",
        background: "var(--cor-superficie)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "20px 24px",
        }}
      >
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--fonte-titulo)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--cor-primaria)",
            }}
          >
            {titulo}
          </p>
          {subtitulo && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--cor-texto-suave)" }}>
              {subtitulo}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
