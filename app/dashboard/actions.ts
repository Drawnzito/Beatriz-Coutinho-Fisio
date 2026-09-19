"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function irComSucesso(mensagem: string, aba: string, extraParams: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ sucesso: mensagem, aba });
  for (const [chave, valor] of Object.entries(extraParams)) {
    if (valor) params.set(chave, valor);
  }
  redirect(`/dashboard?${params.toString()}`);
}

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
  irComSucesso("Exercício adicionado à biblioteca", "biblioteca");
}

export async function removerExercicio(id: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("exercicios").delete().eq("id", id);
  revalidatePath("/dashboard");
  irComSucesso("Exercício removido", "biblioteca");
}

export async function criarAviso(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  await supabase.from("avisos").insert({
    titulo: String(formData.get("titulo") || ""),
    conteudo: String(formData.get("conteudo") || ""),
    validade: String(formData.get("validade") || "") || null,
    criado_por: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Aviso publicado", "avisos");
}

export async function removerAviso(id: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("avisos").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Aviso removido", "avisos");
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
  irComSucesso("Plano criado com sucesso", "plano");
}

export async function criarSessao(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const paciente_id = String(formData.get("paciente_id") || "");
  const data = String(formData.get("data") || "");
  const hora = String(formData.get("hora") || "") || null;
  const plano_id = String(formData.get("plano_id") || "") || null;
  const tipo = String(formData.get("tipo") || "tratamento");
  const observacoes = String(formData.get("observacoes") || "") || null;
  const filtroPaciente = String(formData.get("_filtro_paciente") || "") || undefined;
  const filtroDia = String(formData.get("_filtro_dia") || "") || undefined;

  if (!paciente_id || !data) return;

  await supabase.from("sessoes").insert({
    paciente_id,
    data,
    hora,
    plano_id,
    tipo,
    observacoes,
    criado_por: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Sessão agendada com sucesso", "agenda", { paciente: filtroPaciente, dia: filtroDia });
}

export async function removerSessao(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const filtroPaciente = String(formData.get("_filtro_paciente") || "") || undefined;
  const filtroDia = String(formData.get("_filtro_dia") || "") || undefined;

  await supabase.from("sessoes").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Sessão removida", "agenda", { paciente: filtroPaciente, dia: filtroDia });
}

export async function criarConvitePaciente(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const idadeRaw = formData.get("idade");
  const idade = idadeRaw ? Number(idadeRaw) : null;

  if (!nome || !email) return;

  const { data: perfilExistente } = await supabase
    .from("perfis")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (perfilExistente) {
    irComSucesso("Esse e-mail já tem uma conta vinculada", "pacientes");
  }

  const { data: conviteExistente } = await supabase
    .from("convites_paciente")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (conviteExistente) {
    irComSucesso("Já existe um convite pendente pra esse e-mail", "pacientes");
  }

  await supabase.from("convites_paciente").insert({ nome, email, idade, criado_por: user.id });

  revalidatePath("/dashboard");
  irComSucesso(`${nome} pré-cadastrado — vincula sozinho no primeiro login com Google`, "pacientes");
}

export async function removerConvitePaciente(id: string) {
  const { supabase } = await exigirAdmin();
  await supabase.from("convites_paciente").delete().eq("id", id);
  revalidatePath("/dashboard");
  irComSucesso("Convite removido", "pacientes");
}
