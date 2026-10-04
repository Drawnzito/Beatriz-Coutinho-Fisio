"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enviarEmail } from "@/lib/email";
import { rotuloTipoSessao } from "@/lib/tiposSessao";

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

export async function solicitarSessao(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const data = String(formData.get("data") || "");
  const hora = String(formData.get("hora") || "") || null;
  const tipo = String(formData.get("tipo") || "tratamento");
  const observacoes = String(formData.get("observacoes") || "").trim() || null;

  if (!data) return;

  const { error } = await supabase.rpc("solicitar_sessao", {
    data_sessao: data,
    hora_sessao: hora,
    tipo_sessao: tipo,
    observacoes_sessao: observacoes,
  });

  if (!error) {
    const { data: perfil } = await supabase.from("perfis").select("nome, email").eq("id", user.id).single();
    const { data: admins } = await supabase.from("perfis").select("email").eq("papel", "admin");

    const dataFormatada = new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
    const nomePaciente = perfil?.nome || perfil?.email || "um paciente";

    for (const admin of admins ?? []) {
      if (!admin.email) continue;
      await enviarEmail({
        destinatario: admin.email,
        assunto: `Nova solicitação de sessão — ${nomePaciente}`,
        html: `
          <p><strong>${nomePaciente}</strong> solicitou uma sessão.</p>
          <p>Data: ${dataFormatada}${hora ? ` às ${hora}` : ""}</p>
          <p>Tipo: ${rotuloTipoSessao(tipo)}</p>
          ${observacoes ? `<p>Observações: ${observacoes}</p>` : ""}
          <p>Entre no painel pra aprovar ou recusar.</p>
        `,
      });
    }
  }

  revalidatePath("/inicio");
  revalidatePath("/dashboard");
  redirect("/inicio");
}
