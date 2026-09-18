"use client";

import { Marca } from "./Marca";
import { AcentoCadencia } from "./Acentos";

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
          padding: "18px 24px 14px",
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <Marca tamanho={34} />
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
      <AcentoCadencia
        largura={220}
        opacidade={0.55}
        style={{ display: "block", margin: "0 24px 12px" }}
      />
    </header>
  );
}
