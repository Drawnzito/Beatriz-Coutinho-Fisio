import Link from "next/link";
import { ROTULO_SITUACAO, type VagaHorario } from "@/lib/disponibilidade";
import { corTipoSessao, rotuloTipoSessao } from "@/lib/tiposSessao";
import type { DiaSemana } from "@/lib/semana";
import styles from "./gradeSemanalAgenda.module.css";

type SlotOcupado = { nome: string; tipo: string; status: string; sessaoId: string };

/**
 * Visão alternativa da Agenda: a semana inteira de uma vez, horário por
 * horário, pra enxergar rápido onde tem vaga livre sem abrir dia por dia.
 *
 * Só leitura — pra agir (aprovar, bloquear, marcar) continua sendo preciso
 * voltar pra visão por dia, que é quem tem os formulários.
 */
export function GradeSemanalAgenda({
  dias,
  vagasPorDia,
  sessoesPorSlot,
  hrefDia,
}: {
  dias: DiaSemana[];
  vagasPorDia: { iso: string; vagas: VagaHorario[] }[];
  sessoesPorSlot: Map<string, SlotOcupado>;
  hrefDia: (iso: string) => string;
}) {
  const todasVazias = vagasPorDia.every((d) => d.vagas.length === 0);

  if (todasVazias) {
    return (
      <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5, margin: "0 0 24px" }}>
        Nenhum horário de atendimento cadastrado ainda — configure em "Horários de atendimento" pra
        a grade aparecer aqui.
      </p>
    );
  }

  return (
    <div className={styles.envoltorio}>
      <div className={styles.grade}>
        {dias.map((dia) => {
          const vagas = vagasPorDia.find((v) => v.iso === dia.iso)?.vagas ?? [];

          return (
            <div key={dia.iso} className={styles.coluna}>
              <Link
                href={hrefDia(dia.iso)}
                className={`${styles.cabecalho} ${dia.hoje ? styles.cabecalhoHoje : ""}`}
              >
                <span className={styles.abrev}>{dia.abreviacao}</span>
                <span className={styles.numero}>{dia.numero}</span>
              </Link>

              <div className={styles.slots}>
                {vagas.length === 0 && <p className={styles.semAtendimento}>Sem atendimento</p>}

                {vagas.map((v) => {
                  if (v.situacao === "livre") {
                    return (
                      <Link key={v.hora} href={hrefDia(dia.iso)} className={styles.slotLivre}>
                        {v.hora}
                      </Link>
                    );
                  }

                  if (v.situacao === "bloqueado") {
                    return (
                      <div key={v.hora} className={styles.slotBloqueado} title={`${v.hora} · ${ROTULO_SITUACAO.bloqueado}`}>
                        <span className={styles.hora}>{v.hora}</span>
                        <span className={styles.bloqueadoTexto}>bloqueado</span>
                      </div>
                    );
                  }

                  const info = sessoesPorSlot.get(`${dia.iso}|${v.hora}`);
                  return (
                    <Link
                      key={v.hora}
                      href={hrefDia(dia.iso)}
                      className={styles.slotOcupado}
                      title={info ? `${v.hora} · ${info.nome} · ${rotuloTipoSessao(info.tipo)}` : v.hora}
                    >
                      <span className={styles.ponto} style={{ background: info ? corTipoSessao(info.tipo) : "var(--cor-borda)" }} />
                      <span className={styles.hora}>{v.hora}</span>
                      <span className={styles.paciente}>
                        {info?.nome ?? "—"}
                        {v.situacao === "solicitado" && <em> · a confirmar</em>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
