"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function criarExercicio(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  let videoUrl = String(formData.get("video_url") || "") || null;

  const arquivo = formData.get("video_arquivo") as File | null;
  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "bin";
    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("exercicios")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });

    if (!erroUpload) {
      const { data: publicUrlData } = supabase.storage
        .from("exercicios")
        .getPublicUrl(caminho);
      videoUrl = publicUrlData.publicUrl;
    }
  }

  await supabase.from("exercicios").insert({
    titulo: String(formData.get("titulo") || ""),
    categoria: String(formData.get("categoria") || "geral"),
    descricao: String(formData.get("descricao") || ""),
    video_url: videoUrl,
    series_padrao: Number(formData.get("series_padrao")) || null,
    repeticoes_padrao: Number(formData.get("repeticoes_padrao")) || null,
    criado_por: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
}

export async function removerExercicio(id: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("exercicios").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export async function criarAviso(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  await supabase.from("avisos").insert({
    titulo: String(formData.get("titulo") || ""),
    conteudo: String(formData.get("conteudo") || ""),
    criado_por: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
}

export async function removerAviso(id: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("avisos").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
}

export async function criarPlano(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const paciente_id = String(formData.get("paciente_id") || "");
  const titulo = String(formData.get("titulo") || "");
  const exercicioIds = formData.getAll("exercicio_id") as string[];

  if (!paciente_id || !titulo || exercicioIds.length === 0) return;

  const { data: plano, error } = await supabase
    .from("planos")
    .insert({ paciente_id, titulo, criado_por: user.id })
    .select()
    .single();

  if (error || !plano) return;

  const itens = exercicioIds.map((exercicio_id, i) => ({
    plano_id: plano.id,
    exercicio_id,
    ordem: i,
  }));

  await supabase.from("plano_exercicios").insert(itens);

  revalidatePath("/dashboard");
}

export async function criarSessao(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const paciente_id = String(formData.get("paciente_id") || "");
  const data = String(formData.get("data") || "");
  const hora = String(formData.get("hora") || "") || null;
  const plano_id = String(formData.get("plano_id") || "") || null;
  const observacoes = String(formData.get("observacoes") || "") || null;

  if (!paciente_id || !data) return;

  await supabase.from("sessoes").insert({
    paciente_id,
    data,
    hora,
    plano_id,
    observacoes,
    criado_por: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
}

export async function removerSessao(id: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("sessoes").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
}
