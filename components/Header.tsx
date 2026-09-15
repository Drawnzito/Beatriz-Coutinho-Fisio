"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Header({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid var(--cor-borda)",
        background: "var(--cor-superficie)",
      }}
    >
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
      <button
        onClick={sair}
        style={{
          background: "none",
          border: "1px solid var(--cor-borda)",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 13,
          color: "var(--cor-texto-suave)",
          cursor: "pointer",
        }}
      >
        Sair
      </button>
    </header>
  );
}
