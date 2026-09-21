import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentoEvolucao } from "@/components/pdf/DocumentoEvolucao";

export async function GET(request: Request, { params }: { params: { pacienteId: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { data: perfilAtual } = await supabase.from("perfis").select("papel").eq("id", user.id).single();
  if (perfilAtual?.papel !== "admin") return new Response("Acesso restrito", { status: 403 });

  const { data: paciente } = await supabase
    .from("perfis")
    .select("nome, email")
    .eq("id", params.pacienteId)
    .maybeSingle();
  if (!paciente) return new Response("Paciente não encontrado", { status: 404 });

  const { data: evolucoes } = await supabase
    .from("evolucoes")
    .select("id, data, texto")
    .eq("paciente_id", params.pacienteId)
    .order("data", { ascending: true });

  const nomePaciente = paciente.nome || paciente.email;
  const buffer = await renderToBuffer(
    createElement(DocumentoEvolucao, { nomePaciente, evolucoes: evolucoes ?? [] }) as any
  );

  const nomeArquivo = `evolucao-${nomePaciente}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomeArquivo}.pdf"`,
    },
  });
}
