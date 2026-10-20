import Link from "next/link";
import { CapaExercicio } from "./CapaExercicio";
import styles from "./cartaoTreino.module.css";

/**
 * Treino como cartão visual, com mosaico dos exercícios.
 *
 * A tela de exercícios abria direto na lista completa do primeiro treino —
 * uma coluna longa de linhas com miniatura de 90px, em que todos os
 * exercícios tinham o mesmo peso e nenhum treino tinha cara própria. Aqui o
 * treino se apresenta: uma imagem grande, três menores compondo, e o resto
 * contado em número. O detalhe fica a um toque.
 */
export function CartaoTreino({
  titulo,
  href,
  hrefIniciar,
  itens,
  encerrado = false,
}: {
  titulo: string;
  href: string;
  hrefIniciar?: string;
  itens: { id: string; video_url?: string | null; pdf_url?: string | null; titulo: string }[];
  encerrado?: boolean;
}) {
  const principal = itens[0];
  const secundarios = itens.slice(1, 4);
  const restantes = Math.max(0, itens.length - 4);

  return (
    <article className={`${styles.cartao} ${encerrado ? styles.encerrado : ""}`}>
      <Link href={href} className={styles.area}>
        {/* Quantos quadros pequenos existem é decidido aqui, não por :has()
            no CSS: o número já é conhecido e o seletor de atributo funciona
            em qualquer navegador. */}
        <div className={styles.mosaico} data-secundarios={secundarios.length}>
          <div className={styles.principal}>
            {principal ? (
              <CapaExercicio
                videoUrl={principal.video_url}
                pdfUrl={principal.pdf_url}
                titulo={principal.titulo}
              />
            ) : (
              <span className={styles.vazio}>sem exercícios</span>
            )}
          </div>

          {secundarios.length > 0 && (
            <div className={styles.coluna}>
              {secundarios.map((item, i) => (
                <div key={item.id} className={styles.secundario}>
                  <CapaExercicio videoUrl={item.video_url} pdfUrl={item.pdf_url} titulo={item.titulo} />
                  {/* O "+N" cobre a última miniatura em vez de ocupar um quadro
                      só dele: assim o mosaico não muda de forma com o tamanho
                      do treino. */}
                  {restantes > 0 && i === secundarios.length - 1 && (
                    <span className={styles.restantes}>+{restantes}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.textos}>
          <strong className={styles.titulo}>{titulo}</strong>
          <span className={styles.contagem}>
            {itens.length} exercício{itens.length === 1 ? "" : "s"}
            {encerrado ? " · encerrado" : ""}
          </span>
        </div>
      </Link>

      {hrefIniciar && itens.length > 0 && (
        <Link href={hrefIniciar} className={styles.iniciar}>
          ▶ Iniciar treino
        </Link>
      )}
    </article>
  );
}
