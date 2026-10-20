import { createClient } from "@/lib/supabase/server";
import { envolverEmailComMarca } from "@/lib/emailTemplate";

/**
 * Teto de envios por mês. Fica abaixo dos 3.000 do plano gratuito do Resend
 * de propósito: a margem evita que um pico no fim do mês gere cobrança.
 */
export const LIMITE_MENSAL = 2900;

const REMETENTE_SANDBOX = "Beatriz Coutinho Fisioterapia <onboarding@resend.dev>";
const REMETENTE = process.env.RESEND_FROM || REMETENTE_SANDBOX;

/**
 * Se os e-mails estão saindo pelo remetente de teste do Resend.
 *
 * `onboarding@resend.dev` é o endereço de sandbox: ele só entrega para o
 * e-mail do titular da conta Resend e **recusa todos os outros**. Ou seja,
 * com ele configurado nada chega às pacientes — e a recusa só aparece no log
 * da Vercel, que ninguém abre. Enquanto for o caso, o painel avisa.
 *
 * Para resolver: verificar um domínio no Resend e apontar `RESEND_FROM` pra
 * um endereço desse domínio nas variáveis de ambiente da Vercel.
 */
export function usandoRemetenteDeTeste() {
  return REMETENTE === REMETENTE_SANDBOX;
}

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
        html: envolverEmailComMarca(html),
      }),
    });

    if (!resposta.ok) {
      console.error("[email] Resend recusou o envio:", resposta.status, await resposta.text());
    }
  } catch (erro) {
    console.error("[email] falha de rede ao enviar:", erro);
  }
}
