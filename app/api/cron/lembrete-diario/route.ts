import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Mensagem = { titulo: string; corpo: string; url: string };

export async function GET(request: Request) {
  const autorizacao = request.headers.get("authorization");
  if (autorizacao !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: sessoesHoje } = await supabase
    .from("sessoes")
    .select("paciente_id, hora")
    .eq("data", hoje);

  const { data: admins } = await supabase.from("perfis").select("id").eq("papel", "admin");

  const destinatarios = new Map<string, Mensagem>();

  const porPaciente = new Map<string, string[]>();
  for (const s of sessoesHoje ?? []) {
    const lista = porPaciente.get(s.paciente_id) ?? [];
    if (s.hora) lista.push(String(s.hora).slice(0, 5));
    porPaciente.set(s.paciente_id, lista);
  }

  for (const [pacienteId, horarios] of porPaciente) {
    destinatarios.set(pacienteId, {
      titulo: "Você tem sessão hoje",
      corpo: horarios.length > 0 ? `Horário: ${horarios.sort().join(", ")}. Bons exercícios!` : "Confira o horário no app.",
      url: "/inicio",
    });
  }

  const totalSessoesHoje = sessoesHoje?.length ?? 0;
  if (totalSessoesHoje > 0) {
    for (const admin of admins ?? []) {
      destinatarios.set(admin.id, {
        titulo: "Agenda de hoje",
        corpo: `Você tem ${totalSessoesHoje} sessão${totalSessoesHoje > 1 ? "ões" : ""} hoje.`,
        url: "/dashboard?aba=agenda",
      });
    }
  }

  let enviados = 0;
  let removidos = 0;

  for (const [usuarioId, mensagem] of destinatarios) {
    const { data: inscricoes } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("usuario_id", usuarioId);

    for (const inscricao of inscricoes ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
          } as any,
          JSON.stringify(mensagem)
        );
        enviados++;
      } catch (erro: any) {
        if (erro?.statusCode === 404 || erro?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", inscricao.id);
          removidos++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, destinatarios: destinatarios.size, enviados, removidos });
}
