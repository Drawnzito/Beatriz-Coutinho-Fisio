"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: (ativo: boolean) => React.ReactNode;
};

const ICONE_INICIO = (ativo: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ativo ? "#fff" : "currentColor"} strokeWidth="2">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONE_EXERCICIOS = (ativo: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ativo ? "#fff" : "currentColor"} strokeWidth="2">
    <path d="M6.5 6.5 4 4M17.5 6.5 20 4M6.5 17.5 4 20M17.5 17.5 20 20" strokeLinecap="round" />
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </svg>
);

const ICONE_PAINEL = (ativo: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ativo ? "#fff" : "currentColor"} strokeWidth="2">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M3 9h18M8 4v14" strokeLinecap="round" />
  </svg>
);

const ICONE_PERFIL = (ativo: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ativo ? "#fff" : "currentColor"} strokeWidth="2">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" />
  </svg>
);

export function BottomNav({ papel }: { papel: "admin" | "paciente" }) {
  const pathname = usePathname();

  const itens: Item[] =
    papel === "admin"
      ? [
          { href: "/dashboard", label: "Painel", icon: ICONE_PAINEL },
          { href: "/perfil", label: "Perfil", icon: ICONE_PERFIL },
        ]
      : [
          { href: "/inicio", label: "Início", icon: ICONE_INICIO },
          { href: "/exercicios", label: "Exercícios", icon: ICONE_EXERCICIOS },
          { href: "/perfil", label: "Perfil", icon: ICONE_PERFIL },
        ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        background: "var(--cor-superficie)",
        borderTop: "1px solid var(--cor-borda)",
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
        zIndex: 20,
      }}
    >
      {itens.map((item) => {
        const ativo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: ativo ? "8px 16px" : "8px 10px",
              borderRadius: 20,
              background: ativo ? "var(--cor-primaria)" : "transparent",
              color: ativo ? "#fff" : "var(--cor-texto-suave)",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600,
              transition: "background 0.15s ease",
            }}
          >
            {item.icon(ativo)}
            {ativo && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
