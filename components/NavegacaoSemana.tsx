import Link from "next/link";

function formatarDataCurta(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function NavegacaoSemana({
  inicioIso,
  fimIso,
  hrefAnterior,
  hrefProxima,
  hrefHoje,
  emSemanaAtual,
}: {
  inicioIso: string;
  fimIso: string;
  hrefAnterior: string;
  hrefProxima: string;
  hrefHoje: string;
  emSemanaAtual: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
      <Link href={hrefAnterior} scroll={false} style={botaoSeta} aria-label="Semana anterior">
        ‹
      </Link>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--cor-texto-suave)" }}>
          {formatarDataCurta(inicioIso)} – {formatarDataCurta(fimIso)}
        </span>
        {!emSemanaAtual && (
          <Link
            href={hrefHoje}
            scroll={false}
            style={{ display: "block", fontSize: 11, color: "var(--cor-acento)", marginTop: 2 }}
          >
            voltar pra essa semana
          </Link>
        )}
      </div>
      <Link href={hrefProxima} scroll={false} style={botaoSeta} aria-label="Próxima semana">
        ›
      </Link>
    </div>
  );
}

const botaoSeta: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontSize: 16,
  fontWeight: 700,
  textDecoration: "none",
  flexShrink: 0,
};
