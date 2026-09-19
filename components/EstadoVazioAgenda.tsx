export function EstadoVazioAgenda({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "28px 10px 12px" }}>
      <svg viewBox="0 0 160 130" width="120" height="97.5" style={{ marginBottom: 14 }}>
        <circle cx="80" cy="62" r="46" fill="var(--cor-acento-suave)" opacity="0.7" />
        <path
          d="M 30 78 C 50 40, 95 30, 128 48"
          stroke="var(--cor-acento)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="128" cy="48" r="4.5" fill="var(--cor-acento)" />
        <circle cx="54" cy="50" r="2" fill="var(--cor-primaria)" opacity="0.5" />
        <circle cx="108" cy="30" r="2" fill="var(--cor-primaria)" opacity="0.5" />
      </svg>
      <h4 style={{ fontFamily: "var(--fonte-titulo)", fontSize: 15, color: "var(--cor-primaria-escura)", margin: "0 0 4px" }}>
        {titulo}
      </h4>
      <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: 0, maxWidth: "26ch" }}>{texto}</p>
    </div>
  );
}
