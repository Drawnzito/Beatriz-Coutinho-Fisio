import { removerSessao } from "@/app/dashboard/actions";
import { rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";
import { BadgeStatusSessao } from "./BadgeStatusSessao";
import { ChipEspecialidade } from "./ChipEspecialidade";
import styles from "./cartaoSessaoAgenda.module.css";

/**
 * Sessão na agenda da fisioterapeuta, compacta.
 *
 * O cartão antigo despejava tudo de uma vez — data, status, paciente,
 * especialidade, tipo, profissional, plano, observações e um "remover" — e
 * com cinco sessões no dia a tela já não cabia. Olhar a agenda é quase sempre
 * "quem vem agora": hora, nome e situação. O resto abre no toque.
 *
 * `<details>` nativo de propósito: sem estado de cliente, cada cartão abre
 * sozinho e o conteúdo continua vindo pronto do servidor.
 */
export function CartaoSessaoAgenda({
  sessao,
  numero,
  nomeProfissional,
  filtroPaciente,
  filtroDia,
}: {
  sessao: any;
  numero?: number;
  nomeProfissional: string;
  filtroPaciente: string;
  filtroDia: string;
}) {
  const s = sessao;
  const temDetalhe = Boolean(s.especialidade || s.planos?.titulo || s.observacoes);

  return (
    <details className={styles.cartao} style={{ borderLeftColor: corTipoSessao(s.tipo) }}>
      <summary className={styles.resumo}>
        <span className={styles.hora}>
          {s.hora ? s.hora.slice(0, 5) : "--:--"}
          <small className={styles.data}>{new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR")}</small>
        </span>

        <span className={styles.meio}>
          <strong className={styles.paciente}>{s.perfis?.nome || s.perfis?.email}</strong>
          <span className={styles.linhaFina}>
            {rotuloTipoSessao(s.tipo)}
            {numero ? ` · nº ${numero}` : ""}
          </span>
        </span>

        <span className={styles.direita}>
          <BadgeStatusSessao status={s.status} motivoRecusa={s.motivo_recusa} curto />
          <svg
            className={styles.seta}
            width="16"
            height="16"
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
        </span>
      </summary>

      <div className={styles.corpo}>
        {s.especialidade && (
          <div style={{ marginBottom: 8 }}>
            <ChipEspecialidade especialidade={s.especialidade} modalidade={s.modalidade} />
          </div>
        )}

        <p className={styles.detalhe}>
          Com <strong style={{ color: "var(--cor-primaria)" }}>{nomeProfissional}</strong>
          {s.planos?.titulo && (
            <>
              {" · "}Plano: {s.planos.titulo}
            </>
          )}
        </p>

        {s.observacoes && <p className={styles.observacoes}>{s.observacoes}</p>}

        {!temDetalhe && <p className={styles.detalhe}>Sem especialidade, plano ou observação registrados.</p>}

        <form action={removerSessao.bind(null, s.id)} style={{ marginTop: 10 }}>
          <input type="hidden" name="_filtro_paciente" value={filtroPaciente} />
          <input type="hidden" name="_filtro_dia" value={filtroDia} />
          <button type="submit" className={styles.remover}>
            remover sessão
          </button>
        </form>
      </div>
    </details>
  );
}
