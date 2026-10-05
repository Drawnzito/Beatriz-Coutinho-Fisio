"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: () => React.ReactNode;
};

// Todos os ícones herdam a cor do link (currentColor) pra que o estado ativo
// e o hover do computador sejam resolvidos só no CSS.
const ICONE_INICIO = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONE_EXERCICIOS = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6.5 6.5 4 4M17.5 6.5 20 4M6.5 17.5 4 20M17.5 17.5 20 20" strokeLinecap="round" />
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </svg>
);

const ICONE_PAINEL = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M3 9h18M8 4v14" strokeLinecap="round" />
  </svg>
);

const ICONE_PERFIL = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" />
  </svg>
);

export function BottomNav({ papel }: { papel: "admin" | "paciente" }) {
  const pathname = usePathname();

  const itens: Item[] =
    papel === "admin"
      ? [
          { href: "/inicio", label: "Início", icon: ICONE_INICIO },
          { href: "/exercicios", label: "Exercícios", icon: ICONE_EXERCICIOS },
          { href: "/dashboard", label: "Painel", icon: ICONE_PAINEL },
          { href: "/perfil", label: "Perfil", icon: ICONE_PERFIL },
        ]
      : [
          { href: "/inicio", label: "Início", icon: ICONE_INICIO },
          { href: "/exercicios", label: "Exercícios", icon: ICONE_EXERCICIOS },
          { href: "/perfil", label: "Perfil", icon: ICONE_PERFIL },
        ];

  return (
    // Barra embaixo no celular, barra no topo no computador — a troca é toda
    // em CSS (globals.css), porque estilo inline não aceita media query.
    <nav className="nav-app">
      {itens.map((item) => {
        const ativo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`nav-item${ativo ? " nav-item--ativo" : ""}`}
            data-tour={item.href === "/exercicios" ? "nav-exercicios" : item.href === "/perfil" ? "nav-perfil" : undefined}
          >
            {item.icon()}
            <span className="nav-rotulo">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
