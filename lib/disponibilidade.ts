import type { SupabaseClient } from "@supabase/supabase-js";

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
