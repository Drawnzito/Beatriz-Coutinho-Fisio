"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Header({
  titulo,
  subtitulo,
  papel,
  avatarUrl,
}: {
  titulo: string;
  subtitulo?: string;
  papel?: "admin" | "paciente";
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
          justifyContent: "space-between",
          padding: "20px 24px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
      </div>

      {papel && (
        <nav
          style={{
            display: "flex",
            gap: 4,
            padding: "0 24px",
          }}
        >
          <AbaNav href="/inicio" ativo={pathname === "/inicio"}>
            Meus exercícios
          </AbaNav>
          {papel === "admin" && (
            <AbaNav href="/dashboard" ativo={pathname === "/dashboard"}>
              Painel da fisioterapeuta
            </AbaNav>
          )}
        </nav>
      )}
    </header>
  );
}

function AbaNav({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 600,
        color: ativo ? "var(--cor-primaria)" : "var(--cor-texto-suave)",
        borderBottom: ativo ? "2px solid var(--cor-primaria)" : "2px solid transparent",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
