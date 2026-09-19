import Link from "next/link";
import type { DiaSemana } from "@/lib/semana";

export function TiraSemana({
  dias,
  hrefs,
  selecionado,
  contagens,
}: {
  dias: DiaSemana[];
  hrefs: Record<string, string | undefined>;
  selecionado?: string;
  contagens?: Record<string, number>;
}) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 0" }}>
      {dias.map((dia) => {
        const href = hrefs[dia.iso];
        const temEventos = (contagens?.[dia.iso] ?? 0) > 0;
        const ativo = selecionado === dia.iso;

        const conteudo = (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              width: 44,
              flexShrink: 0,
              padding: "8px 0",
              borderRadius: 12,
              background: ativo ? "var(--cor-primaria)" : dia.hoje ? "var(--cor-acento-suave)" : "var(--cor-superficie)",
              border: `1px solid ${ativo ? "var(--cor-primaria)" : "var(--cor-borda)"}`,
              color: ativo ? "#fff" : "var(--cor-texto)",
              cursor: href ? "pointer" : "default",
              opacity: href ? 1 : 0.45,
            }}
          >
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {dia.abreviacao}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{dia.numero}</span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: temEventos ? (ativo ? "#fff" : "var(--cor-acento)") : "transparent",
              }}
            />
          </div>
        );

        return href ? (
          <Link key={dia.iso} href={href} scroll={false} style={{ textDecoration: "none" }}>
            {conteudo}
          </Link>
        ) : (
          <div key={dia.iso}>{conteudo}</div>
        );
      })}
    </div>
  );
}
