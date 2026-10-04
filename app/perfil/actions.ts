"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  await supabase.from("perfis").update({ whatsapp: whatsapp || null }).eq("id", user.id);

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
  await supabase
    .from("configuracoes_clinica")
    .update({ whatsapp_contato: whatsapp || null, atualizado_em: new Date().toISOString() })
    .eq("id", "global");

  revalidatePath("/perfil");
  revalidatePath("/inicio");
  redirect("/perfil");
}

export async function enviarAvaliacaoApp(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const nota1 = Number(formData.get("nota_1"));
  const nota2 = Number(formData.get("nota_2"));
  const nota3 = Number(formData.get("nota_3"));
  const comentario = String(formData.get("comentario") || "").trim() || null;

  if (!nota1 || !nota2 || !nota3) return;

  await supabase.from("avaliacoes_app").insert({
    paciente_id: user.id,
    nota_1: nota1,
    nota_2: nota2,
    nota_3: nota3,
    comentario,
  });

  revalidatePath("/perfil");
}

export async function marcarGuiaVisto() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("perfis").update({ guia_visto_em: new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/inicio");
}
