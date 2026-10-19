import styles from "./esqueleto.module.css";

/**
 * Tela provisória mostrada enquanto o servidor monta a página.
 *
 * No App Router, sem um `loading.tsx` a navegação fica parada na tela
 * anterior até o servidor responder — e como toda página daqui é
 * `force-dynamic` (consulta o banco a cada acesso), isso dava a sensação de
 * "demora pra trocar de página". Com o esqueleto, a troca é imediata e o
 * conteúdo entra em seguida.
 */
export function Esqueleto({
  comCabecalho = true,
  linhas = 4,
}: {
  comCabecalho?: boolean;
  linhas?: number;
}) {
  return (
    <>
      {comCabecalho && (
        <div
          style={{
            background: "linear-gradient(135deg, var(--cor-primaria-escura), var(--cor-primaria))",
            borderRadius: "0 0 22px 22px",
            padding: "22px 24px 30px",
          }}
        >
          <div className="faixa-interna" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={styles.pulso} style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <div style={{ display: "grid", gap: 7 }}>
              <div className={styles.pulso} style={{ width: 160, height: 15, borderRadius: 6, background: "rgba(255,255,255,0.25)" }} />
              <div className={styles.pulso} style={{ width: 110, height: 11, borderRadius: 6, background: "rgba(255,255,255,0.16)" }} />
            </div>
          </div>
        </div>
      )}

      <main className="conteudo" aria-busy="true" aria-label="Carregando">
        <div style={{ display: "grid", gap: 14 }}>
          <div className={styles.pulso} style={{ width: 150, height: 18, borderRadius: 7, background: "var(--cor-borda)" }} />
          {Array.from({ length: linhas }).map((_, i) => (
            <div
              key={i}
              className={styles.pulso}
              style={{
                height: 78,
                borderRadius: 12,
                background: "var(--cor-superficie)",
                border: "1px solid var(--cor-borda)",
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
