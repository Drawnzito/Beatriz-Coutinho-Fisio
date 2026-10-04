import type { SupabaseClient } from "@supabase/supabase-js";

export async function buscarNumerosSessao(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.rpc("numeros_sessao", { ids });
  if (error || !data) return new Map();

  return new Map(data.map((r: { sessao_id: string; numero: number }) => [r.sessao_id, r.numero]));
}
