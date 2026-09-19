"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function exigirAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (perfil?.papel !== "admin") throw new Error("Acesso restrito à fisioterapeuta");

  return { supabase, user };
}

function irComSucesso(pacienteId: string, mensagem: string) {
  redirect(`/exercicios?paciente=${pacienteId}&sucesso=${encodeURIComponent(mensagem)}`);
}

function irComErro(pacienteId: string, mensagem: string) {
  redirect(`/exercicios?paciente=${pacienteId}&sucesso=${encodeURIComponent(`Erro: ${mensagem}`)}`);
}

export async function atualizarItemPlano(itemId: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const pacienteId = String(formData.get("_paciente") || "");

  const seriesRaw = formData.get("series");
  const repeticoesRaw = formData.get("repeticoes");

  const { error } = await supabase
    .from("plano_exercicios")
    .update({
      series: seriesRaw ? Number(seriesRaw) : null,
      repeticoes: repeticoesRaw ? Number(repeticoesRaw) : null,
    })
    .eq("id", itemId);

  if (error) irComErro(pacienteId, error.message);

  revalidatePath("/exercicios");
  irComSucesso(pacienteId, "Exercício atualizado");
}

export async function removerItemPlano(itemId: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const pacienteId = String(formData.get("_paciente") || "");

  const { error } = await supabase.from("plano_exercicios").delete().eq("id", itemId);
  if (error) irComErro(pacienteId, error.message);

  revalidatePath("/exercicios");
  irComSucesso(pacienteId, "Exercício removido do plano");
}

export async function adicionarExercicioAoPlano(planoId: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const pacienteId = String(formData.get("_paciente") || "");
  const exercicioId = String(formData.get("exercicio_id") || "");

  if (!exercicioId) {
    redirect(`/exercicios?paciente=${pacienteId}`);
  }

  const { data: existentes } = await supabase
    .from("plano_exercicios")
    .select("ordem")
    .eq("plano_id", planoId)
    .order("ordem", { ascending: false })
    .limit(1);

  const proximaOrdem = (existentes?.[0]?.ordem ?? -1) + 1;

  const { error } = await supabase.from("plano_exercicios").insert({
    plano_id: planoId,
    exercicio_id: exercicioId,
    ordem: proximaOrdem,
  });
  if (error) irComErro(pacienteId, error.message);

  revalidatePath("/exercicios");
  irComSucesso(pacienteId, "Exercício adicionado ao plano");
}
