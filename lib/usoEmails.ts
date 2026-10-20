import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITE_MENSAL } from "@/lib/email";

export type UsoEmails = {
  mes: string;
  enviados: number;
  limite: number;
  /** 0 a 100, já arredondado. */
  porcentagem: number;
  restantes: number;
  /** Passou do teto: os envios do mês estão pausados. */
  esgotado: boolean;
  /** Perto do teto — vale a pena aparecer na tela antes de parar. */
  atencao: boolean;
  diasAteVirarOMes: number;
};

/**
 * Quantos e-mails o app já enviou neste mês.
 *
 * Quando o teto é atingido, `enviarEmail` apenas registra no log e devolve
 * sem enviar — de propósito, pra não gerar cobrança. Só que isso é invisível:
 * do lado de cá parece que a paciente foi avisada e ela nunca recebeu nada.
 * Esta leitura existe pra isso virar número na tela.
 *
 * Vai pelo cliente de serviço porque `contador_emails` tem RLS ligada e
 * nenhuma policy: ela só é tocada pela função `registrar_envio_email`. Quem
 * chama aqui já é página de admin.
 */
export async function buscarUsoEmails(): Promise<UsoEmails> {
  const mes = new Date().toISOString().slice(0, 7);

  let enviados = 0;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("contador_emails").select("enviados").eq("mes", mes).maybeSingle();
    enviados = data?.enviados ?? 0;
  } catch {
    // Sem a chave de serviço configurada, o painel mostra zero em vez de quebrar.
  }

  const agora = new Date();
  const primeiroDoProximo = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
  const diasAteVirarOMes = Math.max(
    1,
    Math.ceil((primeiroDoProximo.getTime() - agora.getTime()) / 86400000)
  );

  const porcentagem = Math.min(100, Math.round((enviados / LIMITE_MENSAL) * 100));

  return {
    mes,
    enviados,
    limite: LIMITE_MENSAL,
    porcentagem,
    restantes: Math.max(0, LIMITE_MENSAL - enviados),
    esgotado: enviados >= LIMITE_MENSAL,
    atencao: porcentagem >= 80,
    diasAteVirarOMes,
  };
}
