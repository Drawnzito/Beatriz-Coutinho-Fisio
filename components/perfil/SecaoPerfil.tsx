/**
 * Estrutura do Perfil: seções com título e cartões dentro.
 *
 * Antes a tela era uma coluna só, tudo centralizado, com cada bloco
 * trazendo o próprio estilo — sem hierarquia nenhuma. Aqui os blocos
 * existentes entram como conteúdo de cartões iguais entre si.
 */

export function SecaoPerfil({
  titulo,
  descricao,
  colunas = 2,
  children,
}: {
  titulo: string;
  descricao?: string;
  colunas?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 30 }}>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: 16,
          color: "var(--cor-primaria)",
          margin: "0 0 2px",
        }}
      >
        {titulo}
      </h2>
      {descricao && (
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
          {descricao}
        </p>
      )}
      {!descricao && <div style={{ height: 12 }} />}

      <div className={`grade-auto${colunas === 2 ? " grade-auto--2" : ""}`}>{children}</div>
    </section>
  );
}

export function CartaoPerfil({
  icone,
  titulo,
  descricao,
  destaque = false,
  children,
}: {
  icone?: React.ReactNode;
  titulo: string;
  descricao?: string;
  destaque?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        alignContent: "start",
        padding: "16px 18px",
        borderRadius: 14,
        border: `1px solid ${destaque ? "var(--cor-acento-suave)" : "var(--cor-borda)"}`,
        background: destaque ? "var(--cor-acento-suave)" : "var(--cor-superficie)",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {icone && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 9,
              flexShrink: 0,
              background: destaque ? "rgba(162,70,90,0.14)" : "var(--cor-fundo)",
              color: destaque ? "var(--cor-acento)" : "var(--cor-primaria)",
            }}
          >
            {icone}
          </span>
        )}
        <div>
          <strong
            style={{
              display: "block",
              fontSize: 14,
              color: destaque ? "var(--cor-acento)" : "var(--cor-primaria-escura)",
            }}
          >
            {titulo}
          </strong>
          {descricao && (
            <span style={{ fontSize: 12, color: "var(--cor-texto-suave)", lineHeight: 1.35 }}>
              {descricao}
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- ícones */

const svg = (d: React.ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

export const IconeTelefone = () =>
  svg(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />);

export const IconeSino = () =>
  svg(<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>);

export const IconeEstrela = () =>
  svg(<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />);

export const IconeBussola = () =>
  svg(<><circle cx="12" cy="12" r="10" /><path d="m16.2 7.8-2.4 6.4-6.4 2.4 2.4-6.4Z" /></>);

export const IconeMapa = () =>
  svg(<><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>);

export const IconeOlho = () =>
  svg(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>);

export const IconeCoracao = () =>
  svg(<path d="M19 5.6a5 5 0 0 0-7 0l-.9.9-.9-.9a5 5 0 1 0-7.1 7.1l8 8 8-8a5 5 0 0 0 0-7.1Z" />);

export const IconeMala = () =>
  svg(<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>);
