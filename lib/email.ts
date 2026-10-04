import { createClient } from "@/lib/supabase/server";

const LIMITE_MENSAL = 2900;
const REMETENTE = process.env.RESEND_FROM || "Beatriz Coutinho Fisioterapia <onboarding@resend.dev>";

export async function enviarEmail({
  destinatario,
  assunto,
  html,
}: {
  destinatario: string;
  assunto: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY não configurada — não enviado: "${assunto}" para ${destinatario}`);
    return;
  }

  const supabase = createClient();
  const { data: podeEnviar, error: erroContador } = await supabase.rpc("registrar_envio_email", {
    limite: LIMITE_MENSAL,
  });

  if (erroContador) {
    console.error("[email] falha ao checar o contador mensal, email não enviado:", erroContador.message);
    return;
  }

  if (!podeEnviar) {
    console.warn(`[email] limite mensal (${LIMITE_MENSAL}) atingido — não enviado: "${assunto}" para ${destinatario}`);
    return;
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: destinatario,
        subject: assunto,
        html,
      }),
    });

    if (!resposta.ok) {
      console.error("[email] Resend recusou o envio:", resposta.status, await resposta.text());
    }
  } catch (erro) {
    console.error("[email] falha de rede ao enviar:", erro);
  }
}
