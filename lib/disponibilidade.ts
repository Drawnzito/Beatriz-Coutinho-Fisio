import type { SupabaseClient } from "@supabase/supabase-js";

export type SituacaoHorario = "livre" | "solicitado" | "ocupado" | "bloqueado";

export type VagaHorario = {
  /** "HH:MM" */
  hora: string;
  situacao: SituacaoHorario;
};

/** Situacoes em que o horario ainda pode ser pedido pelo paciente. */
export const SITUACOES_SELECIONAVEIS: SituacaoHorario[] = ["livre", "solicitado"];

export const ROTULO_SITUACAO: Record<SituacaoHorario, string> = {
  livre: "Disponível",
  solicitado: "Alguém já pediu",
  ocupado: "Indisponível",
  bloqueado: "Agenda fechada",
};

/**
 * Vagas do dia, com a situacao de cada uma.
 *
 * Vem de uma RPC security definer porque a policy "paciente ve as proprias
 * sessoes" impede o paciente de consultar a agenda das outras pacientes
 * direto na tabela. A RPC devolve so hora + situacao, sem identificar ninguem.
 */
export async function buscarVagas(
  supabase: SupabaseClient,
  data: string
): Promise<VagaHorario[]> {
  const { data: linhas, error } = await supabase.rpc("horarios_disponiveis", {
    data_consulta: data,
  });

  if (error || !linhas) return [];

  return (linhas as { hora: string; situacao: string }[]).map((l) => ({
    hora: l.hora.slice(0, 5),
    situacao: l.situacao as SituacaoHorario,
  }));
}

export async function verificarConflito(
  supabase: SupabaseClient,
  { data, hora, excluirSessaoId }: { data: string; hora: string; excluirSessaoId?: string }
): Promise<string | null> {
  const { data: bloqueio } = await supabase
    .from("bloqueios_agenda")
    .select("id, motivo")
    .eq("data", data)
    .lte("hora_inicio", hora)
    .gt("hora_fim", hora)
    .maybeSingle();

  if (bloqueio) {
    return `Esse horário está bloqueado na agenda${bloqueio.motivo ? ` (${bloqueio.motivo})` : ""}`;
  }

  let consulta = supabase
    .from("sessoes")
    .select("id")
    .eq("data", data)
    .eq("hora", hora)
    .in("status", ["agendada", "confirmada"]);
  if (excluirSessaoId) consulta = consulta.neq("id", excluirSessaoId);

  const { data: conflitante } = await consulta.maybeSingle();
  if (conflitante) return "Já existe uma sessão marcada nesse horário";

  return null;
}

/**
 * Mesma checagem acima, mais a exigencia de que a hora exista na grade.
 *
 * Usada no fluxo do PACIENTE. A fisio continua podendo encaixar fora da
 * grade (`verificarConflito` puro) - ela e quem manda na propria agenda.
 *
 * Se a grade do dia estiver vazia (dia sem atendimento cadastrado), cai de
 * volta na checagem simples em vez de travar tudo: isso evita que o app pare
 * de aceitar solicitacoes caso a Beatriz ainda nao tenha configurado nada.
 */
export async function verificarConflitoNaGrade(
  supabase: SupabaseClient,
  { data, hora }: { data: string; hora: string }
): Promise<string | null> {
  const vagas = await buscarVagas(supabase, data);

  if (vagas.length > 0) {
    const vaga = vagas.find((v) => v.hora === hora.slice(0, 5));
    if (!vaga) return "Esse horário não está na agenda de atendimento";
    if (!SITUACOES_SELECIONAVEIS.includes(vaga.situacao)) {
      return vaga.situacao === "bloqueado"
        ? "Esse horário está bloqueado na agenda"
        : "Esse horário já foi preenchido";
    }
    return null;
  }

  return verificarConflito(supabase, { data, hora });
}
