import styles from "./secaoRecolhivel.module.css";

/**
 * Seção que abre e fecha, com cara de botão.
 *
 * As seções do painel eram `<details>` cujo `<summary>` era só um texto em
 * negrito terracota — do lado da paciente essa cor é de alerta, então
 * "Horários de atendimento" e "Bloquear agenda" pareciam notificação de erro
 * e não davam nenhuma pista de que dava pra clicar.
 *
 * Continua sendo `<details>` nativo: abre sem JavaScript e sobrevive ao
 * conteúdo todo vir do servidor.
 */
export function SecaoRecolhivel({
  titulo,
  descricao,
  contador,
  icone,
  tom = "neutro",
  comecarAberta = false,
  children,
}: {
  titulo: string;
  descricao?: string;
  /** Quantos itens a seção já tem. Mostrado como selo ao lado do título. */
  contador?: number;
  icone?: React.ReactNode;
  /** "acao" destaca a seção como o começo de uma tarefa (fundo verde claro). */
  tom?: "neutro" | "acao";
  comecarAberta?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={styles.secao} data-tom={tom} open={comecarAberta}>
      <summary className={styles.cabecalho}>
        {icone && <span className={styles.icone}>{icone}</span>}

        <span className={styles.textos}>
          <span className={styles.titulo}>
            {titulo}
            {typeof contador === "number" && contador > 0 && <span className={styles.contador}>{contador}</span>}
          </span>
          {descricao && <span className={styles.descricao}>{descricao}</span>}
        </span>

        <svg
          className={styles.seta}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      <div className={styles.corpo}>{children}</div>
    </details>
  );
}
