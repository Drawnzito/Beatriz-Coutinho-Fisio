"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Guarda que a paciente terminou o treino.
 *
 * Chamada da tela de execução quando ela chega na última série do último
 * exercício. Os números vêm do cliente, mas nada aqui confia neles: o plano é
 * relido do banco pra conferir que é mesmo dela e pra pegar o título e a
 * contagem de exercícios da fonte certa.
 */
export async function registrarTreinoConcluido(planoId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: plano } = await supabase
    .from("planos")
    .select("id, titulo, paciente_id, plano_exercicios(id, series, exercicios(series_padrao))")
    .eq("id", planoId)
    .single();

  // Mesma checagem da página: plano de outra pessoa não vira registro.
  if (!plano || plano.paciente_id !== user.id) return;

  // Mesma conta da tela de execução: sem séries no plano vale o padrão do
  // exercício, e sem nenhum dos dois conta como uma série.
  const itens = plano.plano_exercicios ?? [];
  const seriesFeitas = itens.reduce((soma: number, item: any) => {
    const series = item.series ?? item.exercicios?.series_padrao;
    return soma + (series && series > 0 ? series : 1);
  }, 0);

  const { error } = await supabase.from("treinos_realizados").insert({
    paciente_id: user.id,
    plano_id: plano.id,
    titulo_plano: plano.titulo,
    exercicios_feitos: itens.length,
    series_feitas: seriesFeitas,
  });

  // Erro aqui não vira aviso na tela: a paciente acabou de fazer o treino
  // inteiro e a comemoração é o que ela espera ver. Some no log pra dar pra
  // investigar, sem transformar um problema nosso em problema dela.
  if (error) {
    console.error("[treino] não consegui registrar a conclusão:", error.message);
    return;
  }

  revalidatePath("/exercicios");
  revalidatePath("/dashboard");
}
