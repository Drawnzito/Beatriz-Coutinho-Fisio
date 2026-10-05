/**
 * Passo a passo do exercício.
 *
 * O campo nasceu como PDF (coluna `exercicios.pdf_url`) e passou a receber
 * imagem. Os dois convivem: exercícios antigos continuam com PDF salvo, e os
 * novos vêm como foto. Aqui a renderização é escolhida pela extensão do
 * arquivo em vez de assumir PDF.
 */

export function ehImagemPassoAPasso(url: string): boolean {
  return /\.(gif|png|jpe?g|webp|heic)$/.test(url.split("?")[0].toLowerCase());
}

/** Versão grande, dentro da execução do treino. */
export function PassoAPasso({ url }: { url: string }) {
  if (ehImagemPassoAPasso(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Passo a passo do exercício"
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1px solid var(--cor-borda)",
          display: "block",
        }}
      />
    );
  }

  return (
    <>
      <iframe
        src={url}
        title="Passo a passo em PDF"
        style={{
          width: "100%",
          height: 420,
          border: "1px solid var(--cor-borda)",
          borderRadius: 10,
          display: "block",
        }}
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{ display: "inline-block", marginTop: 6, fontSize: 12.5, color: "var(--cor-acento)" }}
      >
        abrir PDF em nova aba →
      </a>
    </>
  );
}

/** Link curto, usado embaixo das miniaturas nas listagens. */
export function AtalhoPassoAPasso({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginTop: 6,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--cor-acento)",
        textDecoration: "none",
      }}
    >
      {ehImagemPassoAPasso(url) ? "🖼 Ver passo a passo" : "📄 PDF passo a passo"}
    </a>
  );
}
