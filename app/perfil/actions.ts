"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { enviarEmail } from "@/lib/email";
import type { ResultadoAcao } from "@/lib/resultadoAcao";

export async function ativarVisaoPaciente() {
  cookies().set("ver_como_paciente", "1", { path: "/", maxAge: 60 * 60 * 4 });
  redirect("/inicio");
}

export async function desativarVisaoPaciente() {
  cookies().set("ver_como_paciente", "", { path: "/", maxAge: 0 });
  redirect("/dashboard");
}

export async function salvarInscricaoPush(inscricao: { endpoint: string; p256dh: string; auth: string }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("push_subscriptions").upsert(
    {
      usuario_id: user.id,
      endpoint: inscricao.endpoint,
      p256dh: inscricao.p256dh,
      auth: inscricao.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function removerInscricaoPush(endpoint: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("usuario_id", user.id);
}

export async function atualizarMeuWhatsapp(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const whatsapp = String(formData.get("whatsapp") || "").trim();
  await supabase.rpc("atualizar_meu_whatsapp", { novo_whatsapp: whatsapp || null });

  revalidatePath("/perfil");
  redirect("/perfil");
}

export async function atualizarWhatsappContato(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase.from("perfis").select("papel").eq("id", user.id).single();
  if (perfil?.papel !== "admin") return;

  const whatsapp = String(formData.get("whatsapp_contato") || "").trim();

  // `upsert` com o cliente de serviço, e não `update` com o do usuário: se a
  // linha 'global' não existir (banco restaurado, schema_13 rodado pela
  // metade), um update não acerta linha nenhuma e o Supabase não reclama —
  // ficaria parecendo que salvou. O papel de admin já foi conferido acima.
  const admin = createAdminClient();
  const { error } = await admin.from("configuracoes_clinica").upsert({
    id: "global",
    whatsapp_contato: whatsapp || null,
    atualizado_em: new Date().toISOString(),
  });

  revalidatePath("/perfil");
  revalidatePath("/inicio");
  revalidatePath("/exercicios");
  redirect(error ? `/perfil?erro=${encodeURIComponent(error.message)}` : "/perfil?salvo=1");
}

export async function enviarAvaliacaoApp(
  _anterior: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão expirou. Entre de novo pra avaliar." };

  const nota1 = Number(formData.get("nota_1"));
  const nota2 = Number(formData.get("nota_2"));
  const nota3 = Number(formData.get("nota_3"));
  const comentario = String(formData.get("comentario") || "").trim() || null;

  // Mesma conferência da avaliação de atendimento: nota fora de 1–5 entraria
  // e torceria a média mostrada no painel.
  const notaValida = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!notaValida(nota1) || !notaValida(nota2) || !notaValida(nota3)) {
    return { ok: false, erro: "Dê uma nota de 1 a 5 em cada pergunta." };
  }

  const { error } = await supabase.from("avaliacoes_app").insert({
    paciente_id: user.id,
    nota_1: nota1,
    nota_2: nota2,
    nota_3: nota3,
    comentario,
  });

  if (error) return { ok: false, erro: "Não consegui enviar sua avaliação agora. Tenta de novo?" };

  revalidatePath("/perfil");
  return { ok: true };
}

export async function criarIndicacao(
  _anterior: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão expirou. Entre de novo pra indicar." };

  const nome = String(formData.get("nome_indicada") || "").trim();
  const contato = String(formData.get("contato_indicada") || "").trim();

  if (!nome || !contato) {
    return { ok: false, erro: "Preencha o nome e o contato da sua amiga." };
  }

  const { error } = await supabase.from("indicacoes").insert({
    paciente_id: user.id,
    nome_indicada: nome,
    contato_indicada: contato,
  });

  if (error) {
    return { ok: false, erro: "Não consegui registrar a indicação agora. Tenta de novo?" };
  }

  // Avisa a Beatriz por e-mail: o contador na aba Indicações só resolve se ela
  // abrir o painel, e indicação some no meio de outras coisas.
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, email")
    .eq("id", user.id)
    .single();
  const { data: admins } = await supabase.from("perfis").select("email").eq("papel", "admin");

  const quemIndicou = perfil?.nome || perfil?.email || "Uma paciente";

  for (const admin of admins ?? []) {
    if (!admin.email) continue;
    await enviarEmail({
      destinatario: admin.email,
      assunto: `Nova indicação — ${nome}`,
      html: `
        <p><strong>${quemIndicou}</strong> indicou alguém para a fisioterapia pélvica domiciliar.</p>
        <p>Nome: <strong>${nome}</strong></p>
        <p>Contato: <strong>${contato}</strong></p>
        <p>A indicada tem 50% de desconto na primeira sessão. Marque como usada no painel,
        na aba Indicações, quando aplicar o desconto.</p>
      `,
    });
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function marcarGuiaVisto() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("marcar_guia_visto");
  revalidatePath("/inicio");
}
