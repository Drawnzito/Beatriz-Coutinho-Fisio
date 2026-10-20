import { BadgeStatusSessao } from "./BadgeStatusSessao";
import { ChipEspecialidade } from "./ChipEspecialidade";
import { rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";
import styles from "./cartaoSessaoResumo.module.css";

/**
 * Sessão numa lista de consulta: histórico da paciente, próximas sessões e
 * histórico dentro da ficha, no painel.
 *
 * Os três lugares mostravam a mesma coisa com três desenhos diferentes — um
 * com a data em negrito e tudo corrido, outro com a especialidade antes do
 * tipo, outro com o selo em posições diferentes. Aqui a hierarquia é sempre
 * a mesma: quando (grande), situação (canto), e o resto em linha fina.
 */
export function CartaoSessaoResumo({
  sessao,
  /** Nome mostrado no lugar do tipo — usado no painel, onde importa quem é. */
  nomePaciente,
  detalhe,
  /** Reduz ainda mais o cartão (fonte/padding) — pra listas onde cada linha já conta menos (ex: sessões anteriores). */
  compacto,
  children,
}: {
  sessao: any;
  nomePaciente?: string;
  /** Linha extra embaixo (plano, observações). */
  detalhe?: string;
  compacto?: boolean;
  /** Ação no pé do cartão, como "Avaliar atendimento". */
  children?: React.ReactNode;
}) {
  const s = sessao;
  const data = new Date(`${s.data}T00:00:00`);

  return (
    <div
      className={`${styles.cartao} ${compacto ? styles.compacto : ""}`}
      style={{ borderLeftColor: corTipoSessao(s.tipo) }}
    >
      <div className={styles.topo}>
        <span className={styles.quando}>
          <strong className={styles.dia}>
            {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </strong>
          <small className={styles.diaSemana}>
            {data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
            {s.hora ? ` · ${s.hora.slice(0, 5)}` : ""}
          </small>
        </span>

        <BadgeStatusSessao status={s.status} motivoRecusa={s.motivo_recusa} curto />
      </div>

      <p className={styles.linha}>{nomePaciente || rotuloTipoSessao(s.tipo)}</p>

      {s.especialidade && (
        <div className={styles.chip}>
          <ChipEspecialidade especialidade={s.especialidade} modalidade={s.modalidade} tamanho="pequeno" />
        </div>
      )}

      {detalhe && <p className={styles.detalhe}>{detalhe}</p>}

      {children && <div className={styles.acao}>{children}</div>}
    </div>
  );
}
