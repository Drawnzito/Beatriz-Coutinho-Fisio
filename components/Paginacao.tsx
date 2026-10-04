import Link from "next/link";

export function Paginacao({
  pagina,
  total,
  tamanhoPagina,
  hrefPagina,
}: {
  pagina: number;
  total: number;
  tamanhoPagina: number;
  hrefPagina: (pagina: number) => string;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina));
  if (totalPaginas <= 1) return null;

  const inicio = (pagina - 1) * tamanhoPagina + 1;
  const fim = Math.min(pagina * tamanhoPagina, total);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 14,
        fontSize: 12.5,
        color: "var(--cor-texto-suave)",
      }}
    >
      <span>{inicio}–{fim} de {total}</span>
      <div style={{ display: "flex", gap: 14 }}>
        {pagina > 1 ? (
          <Link href={hrefPagina(pagina - 1)} style={{ color: "var(--cor-acento)", fontWeight: 600, textDecoration: "none" }}>
            ← anterior
          </Link>
        ) : (
          <span style={{ opacity: 0.4 }}>← anterior</span>
        )}
        {pagina < totalPaginas ? (
          <Link href={hrefPagina(pagina + 1)} style={{ color: "var(--cor-acento)", fontWeight: 600, textDecoration: "none" }}>
            próxima →
          </Link>
        ) : (
          <span style={{ opacity: 0.4 }}>próxima →</span>
        )}
      </div>
    </div>
  );
}
