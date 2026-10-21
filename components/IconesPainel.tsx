/** Ícones das áreas do painel. Traço fino, mesma pegada dos ícones do Perfil. */

const base = {
  width: 21,
  height: 21,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconeAgenda() {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconePacientes() {
  return (
    <svg {...base} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3" />
      <path d="M16.5 6.4a3 3 0 0 1 0 5.6M18 14.9c2 .7 3.4 2.4 3.4 4.6" />
    </svg>
  );
}

export function IconeTreinos() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M4 9v6M20 9v6M7 6.5v11M17 6.5v11" />
      <path d="M7 12h10" />
    </svg>
  );
}

/* ---------- Ícones das seções recolhíveis ---------- */

export function IconeRelogio() {
  return (
    <svg {...base} width={19} height={19} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function IconeCadeado() {
  return (
    <svg {...base} width={19} height={19} aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function IconeMais() {
  return (
    <svg {...base} width={19} height={19} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.4v7.2M8.4 12h7.2" />
    </svg>
  );
}

export function IconeEvolucao() {
  return (
    <svg {...base} width={19} height={19} aria-hidden="true">
      <path d="M3 13h3.3l1.9-5.5 3 10 2.1-7.5H21" />
    </svg>
  );
}

export function IconeLista() {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeGrade() {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconeConteudo() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M4 10.5v3a1.5 1.5 0 0 0 1.5 1.5H8l5 4V5L8 9H5.5A1.5 1.5 0 0 0 4 10.5Z" />
      <path d="M17.5 9.2a4 4 0 0 1 0 5.6" />
    </svg>
  );
}
