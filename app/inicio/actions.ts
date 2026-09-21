"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function responderSessao(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const sessaoId = String(formData.get("sessao_id") || "");
  const novoStatus = String(formData.get("novo_status") || "");
  const motivo = String(formData.get("motivo") || "").trim() || null;

  if (!sessaoId || (novoStatus !== "confirmada" && novoStatus !== "recusada")) return;

  await supabase.rpc("responder_sessao", {
    sessao_id: sessaoId,
    novo_status: novoStatus,
    motivo,
  });

  revalidatePath("/inicio");
  revalidatePath("/dashboard");
}
