"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enviarEmail } from "@/lib/email";
import { rotuloTipoSessao } from "@/lib/tiposSessao";
import { rotuloEspecialidade, rotuloModalidade } from "@/lib/especialidades";
import { buscarVagas, verificarConflitoNaGrade, type VagaHorario } from "@/lib/disponibilidade";
import { hojeIsoBrasil } from "@/lib/dataBrasil";

/**
 * Vagas do dia pro seletor de horario.
 *
 * E um Server Action, e nao uma chamada direta do navegador, pra nao arrastar
 * o cliente do Supabase pro bundle do /inicio - que e a tela que as pacientes
 * mais abrem. So isso segurava ~70 kB de JavaScript a mais na primeira carga.
 */
export async function buscarVagasDoDia(data: string): Promise<VagaHorario[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return [];

  return buscarVagas(supabase, data);
}

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

  const { error } = await supabase.rpc("responder_sessao", {
    sessao_id: sessaoId,
    novo_status: novoStatus,
    motivo,
  });

  revalidatePath("/inicio");
  revalidatePath("/dashboard");

  // Falhar calado aqui é pior do que parece: o cartão volta com o mesmo
  // botão, e a paciente acha que confirmou presença sem ter confirmado.
  if (error) {
    redirect(`/inicio?conflito=${encodeURIComponent(`Não consegui registrar sua resposta: ${error.message}`)}`);
  }
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
  const especialidade = String(formData.get("especialidade") || "") || null;
  const modalidade = especialidade === "pelvica" ? String(formData.get("modalidade") || "presencial") : null;
  const observacoes = String(formData.get("observacoes") || "").trim() || null;

  if (!data || !especialidade) {
    redirect(`/inicio?conflito=${encodeURIComponent("Escolha a data e a especialidade.")}`);
  }

  // Data no passado: o seletor do navegador não impede digitar, e o pedido
  // chegava pra Beatriz marcado pra ontem.
  if (data < hojeIsoBrasil()) {
    redirect(`/inicio?conflito=${encodeURIComponent("Essa data já passou. Escolha um dia a partir de hoje.")}`);
  }

  // Revalida no servidor mesmo com a grade na tela: entre carregar os
  // horarios e enviar o formulario, outra paciente pode ter ficado com a vaga.
  if (hora) {
    const conflito = await verificarConflitoNaGrade(supabase, { data, hora });
    if (conflito) {
      redirect(`/inicio?conflito=${encodeURIComponent(conflito)}`);
    }
  }

  const { error } = await supabase.rpc("solicitar_sessao", {
    data_sessao: data,
    hora_sessao: hora,
    tipo_sessao: tipo,
    observacoes_sessao: observacoes,
    especialidade_sessao: especialidade,
    modalidade_sessao: modalidade,
  });

  // Antes o erro era ignorado: a tela voltava igual à de um pedido aceito, e
  // a paciente ficava esperando uma resposta que nunca vinha porque o pedido
  // nem tinha sido criado.
  if (error) {
    redirect(`/inicio?conflito=${encodeURIComponent(`Não consegui registrar o pedido: ${error.message}`)}`);
  }

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
        <p>Especialidade: ${rotuloEspecialidade(especialidade) || especialidade}${modalidade ? ` (${rotuloModalidade(modalidade)})` : ""}</p>
        ${observacoes ? `<p>Observações: ${observacoes}</p>` : ""}
        <p>Entre no painel pra aprovar ou recusar.</p>
      `,
    });
  }

  revalidatePath("/inicio");
  revalidatePath("/dashboard");
  redirect("/inicio");
}

export async function enviarAvaliacaoAtendimento(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const sessaoId = String(formData.get("sessao_id") || "") || null;
  const nota1 = Number(formData.get("nota_1"));
  const nota2 = Number(formData.get("nota_2"));
  const nota3 = Number(formData.get("nota_3"));
  const comentario = String(formData.get("comentario") || "").trim() || null;

  // As notas vêm de estrelas na tela, mas o formulário é texto como qualquer
  // outro: sem conferir a faixa aqui, uma nota 9 entraria e torceria a média
  // que a Beatriz vê na aba Avaliações.
  const notaValida = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!notaValida(nota1) || !notaValida(nota2) || !notaValida(nota3)) return;

  await supabase.from("avaliacoes_atendimento").insert({
    paciente_id: user.id,
    sessao_id: sessaoId,
    nota_1: nota1,
    nota_2: nota2,
    nota_3: nota3,
    comentario,
  });

  revalidatePath("/inicio");
}
