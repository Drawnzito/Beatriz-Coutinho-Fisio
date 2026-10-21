import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarVagas, type VagaHorario } from "./disponibilidade";
import type { DiaSemana } from "./semana";

export type SlotOcupado = { nome: string; tipo: string; status: string; sessaoId: string };

/**
 * Dados da grade semanal da Agenda (vagas de cada dia + quem ocupa cada
 * horário). Usado tanto no Painel (aba Agenda) quanto no Início do admin —
 * centralizado aqui pra não duplicar a mesma lógica nos dois lugares.
 */
export async function buscarGradeSemanal(
  supabase: SupabaseClient,
  dias: DiaSemana[]
): Promise<{ vagasPorDia: { iso: string; vagas: VagaHorario[] }[]; sessoesPorSlot: Map<string, SlotOcupado> }> {
  const vagasPorDia = await Promise.all(
    dias.map(async (d) => ({ iso: d.iso, vagas: await buscarVagas(supabase, d.iso) }))
  );

  const { data: sessoesDaSemana } = await supabase
    .from("sessoes")
    .select("id, data, hora, status, tipo, perfis!paciente_id(nome, email)")
    .gte("data", dias[0].iso)
    .lte("data", dias[6].iso)
    .in("status", ["agendada", "confirmada", "solicitada"]);

  const sessoesPorSlot = new Map<string, SlotOcupado>();
  for (const s of (sessoesDaSemana ?? []) as any[]) {
    if (!s.hora) continue;
    sessoesPorSlot.set(`${s.data}|${s.hora.slice(0, 5)}`, {
      nome: s.perfis?.nome || s.perfis?.email || "—",
      tipo: s.tipo,
      status: s.status,
      sessaoId: s.id,
    });
  }

  return { vagasPorDia, sessoesPorSlot };
}
