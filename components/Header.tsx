"use client";

import { Marca } from "./Marca";
import { AcentoCadencia, AcentoArabesque } from "./Acentos";

export function Header({
  titulo,
  subtitulo,
  avatarUrl,
  variante = "padrao",
}: {
  titulo: string;
  subtitulo?: string;
  avatarUrl?: string | null;
  variante?: "padrao" | "boasVindas";
}) {
  const destaque = variante === "boasVindas";

  return (
    <header
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: destaque ? "none" : "1px solid var(--cor-borda)",
        borderRadius: destaque ? "0 0 22px 22px" : 0,
        background: destaque
          ? "linear-gradient(135deg, var(--cor-primaria-escura), var(--cor-primaria))"
          : "var(--cor-superficie)",
      }}
    >
      {destaque && (
        <AcentoArabesque
          tamanho={200}
          cor="#ffffff"
          opacidade={0.12}
          style={{ position: "absolute", top: -30, right: -40, pointerEvents: "none" }}
        />
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: destaque ? "22px 24px 18px" : "18px 24px 14px",
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={destaque ? 48 : 40}
            height={destaque ? 48 : 40}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: destaque ? "2px solid rgba(255,255,255,0.75)" : "none",
            }}
          />
        ) : destaque ? (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.16)",
              border: "2px solid rgba(255,255,255,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Marca tamanho={26} corB="#ffffff" corC="rgba(255,255,255,0.7)" />
          </div>
        ) : (
          <Marca tamanho={34} />
        )}
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--fonte-titulo)",
              fontSize: destaque ? 22 : 20,
              fontWeight: 700,
              color: destaque ? "#ffffff" : "var(--cor-primaria)",
            }}
          >
            {titulo}
          </p>
          {subtitulo && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: destaque ? "rgba(255,255,255,0.8)" : "var(--cor-texto-suave)",
              }}
            >
              {subtitulo}
            </p>
          )}
        </div>
      </div>
      <AcentoCadencia
        largura={220}
        cor={destaque ? "#ffffff" : "var(--cor-acento)"}
        opacidade={destaque ? 0.4 : 0.55}
        style={{ position: "relative", display: "block", margin: "0 24px 16px" }}
      />
    </header>
  );
}
