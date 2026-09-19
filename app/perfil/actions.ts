"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function ativarVisaoPaciente() {
  cookies().set("ver_como_paciente", "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
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
