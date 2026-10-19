"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enviarEmail } from "@/lib/email";
import { rotuloTipoSessao } from "@/lib/tiposSessao";
import { verificarConflito } from "@/lib/disponibilidade";
import type { AbaPainelId } from "@/lib/abasPainel";

function irComSucesso(mensagem: string, aba: AbaPainelId, extraParams: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ sucesso: mensagem, aba });
  for (const [chave, valor] of Object.entries(extraParams)) {
    if (valor) params.set(chave, valor);
  }
  redirect(`/dashboard?${params.toString()}`);
}

function irComErro(mensagem: string, aba: AbaPainelId, extraParams: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ sucesso: `Erro: ${mensagem}`, aba });
  for (const [chave, valor] of Object.entries(extraParams)) {
    if (valor) params.set(chave, valor);
  }
  redirect(`/dashboard?${params.toString()}`);
}

async function exigirAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (perfil?.papel !== "admin") throw new Error("Acesso restrito à fisioterapeuta");

  return { supabase, user };
}

export async function criarExercicio(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  // O arquivo ja subiu pro Storage pelo navegador (components/UploadArquivo),
  // aqui so chega a URL publica. Upload direto evita o teto de 1 MB do corpo
  // de um Server Action, que fazia GIF de galeria falhar calado.
  const videoUrl =
    String(formData.get("video_arquivo_url") || "").trim() ||
    String(formData.get("video_url") || "").trim() ||
    null;

  const pdfUrl =
    String(formData.get("pdf_arquivo_url") || "").trim() ||
    String(formData.get("pdf_url") || "").trim() ||
    null;

  const { error } = await supabase.from("exercicios").insert({
    titulo: String(formData.get("titulo") || ""),
    categoria: String(formData.get("categoria") || "geral"),
    descricao: String(formData.get("descricao") || ""),
    video_url: videoUrl,
    pdf_url: pdfUrl,
    series_padrao: Number(formData.get("series_padrao")) || null,
    repeticoes_padrao: Number(formData.get("repeticoes_padrao")) || null,
    criado_por: user.id,
  });
  if (error) irComErro(error.message, "biblioteca");

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Exercício adicionado à biblioteca", "biblioteca");
}

export async function removerExercicio(id: string) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("exercicios").delete().eq("id", id);
  if (error) irComErro(error.message, "biblioteca");
  revalidatePath("/dashboard");
  irComSucesso("Exercício removido", "biblioteca");
}

export async function atualizarExercicio(id: string, formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const atualizacao: Record<string, unknown> = {
    titulo: String(formData.get("titulo") || ""),
    categoria: String(formData.get("categoria") || "geral"),
    descricao: String(formData.get("descricao") || ""),
    series_padrao: Number(formData.get("series_padrao")) || null,
    repeticoes_padrao: Number(formData.get("repeticoes_padrao")) || null,
  };

  // Campo em branco = manter o que ja estava salvo (por isso o `if`, e nao um
  // `?? null`): o formulario de edicao nao reenvia a midia atual.
  const videoNovo =
    String(formData.get("video_arquivo_url") || "").trim() ||
    String(formData.get("video_url") || "").trim();
  if (videoNovo) atualizacao.video_url = videoNovo;

  const pdfNovo =
    String(formData.get("pdf_arquivo_url") || "").trim() ||
    String(formData.get("pdf_url") || "").trim();
  if (pdfNovo) atualizacao.pdf_url = pdfNovo;

  const { error } = await supabase.from("exercicios").update(atualizacao).eq("id", id);
  if (error) irComErro(error.message, "biblioteca");

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  revalidatePath("/exercicios");
  irComSucesso("Exercício atualizado", "biblioteca");
}

export async function criarAviso(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const { error } = await supabase.from("avisos").insert({
    titulo: String(formData.get("titulo") || ""),
    conteudo: String(formData.get("conteudo") || ""),
    validade: String(formData.get("validade") || "") || null,
    criado_por: user.id,
  });
  if (error) irComErro(error.message, "avisos");

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Aviso publicado", "avisos");
}

export async function removerAviso(id: string) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("avisos").delete().eq("id", id);
  if (error) irComErro(error.message, "avisos");
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Aviso removido", "avisos");
}

function montarItensPlano(formData: FormData, exercicioIds: string[]) {
  return exercicioIds.map((exercicio_id, i) => {
    const seriesRaw = formData.get(`series_${exercicio_id}`);
    const repeticoesRaw = formData.get(`repeticoes_${exercicio_id}`);
    const series = seriesRaw ? Number(seriesRaw) : null;
    const repeticoes = repeticoesRaw ? Number(repeticoesRaw) : null;
    return {
      exercicio_id,
      ordem: i,
      series: series && series > 0 ? series : null,
      repeticoes: repeticoes && repeticoes > 0 ? repeticoes : null,
    };
  });
}

export async function criarPlano(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const paciente_id = String(formData.get("paciente_id") || "");
  const titulo = String(formData.get("titulo") || "");
  const exercicioIds = formData.getAll("exercicio_id") as string[];

  if (!paciente_id || !titulo || exercicioIds.length === 0) return;

  const { data: plano, error } = await supabase
    .from("planos")
    .insert({ paciente_id, titulo, criado_por: user.id })
    .select()
    .single();

  if (error || !plano) {
    irComErro(error?.message ?? "não foi possível criar o plano", "plano");
    return;
  }

  const itens = montarItensPlano(formData, exercicioIds).map((item) => ({
    ...item,
    plano_id: plano.id,
  }));

  const { error: erroItens } = await supabase.from("plano_exercicios").insert(itens);
  if (erroItens) irComErro(erroItens.message, "plano");

  revalidatePath("/dashboard");
  irComSucesso("Plano criado com sucesso", "plano");
}

export async function atualizarPlano(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();

  const titulo = String(formData.get("titulo") || "");
  const exercicioIds = formData.getAll("exercicio_id") as string[];

  if (!titulo || exercicioIds.length === 0) {
    irComErro("informe o título e selecione ao menos um exercício", "plano");
    return;
  }

  const { error: erroTitulo } = await supabase.from("planos").update({ titulo }).eq("id", id);
  if (erroTitulo) {
    irComErro(erroTitulo.message, "plano");
    return;
  }

  const { error: erroRemover } = await supabase.from("plano_exercicios").delete().eq("plano_id", id);
  if (erroRemover) {
    irComErro(erroRemover.message, "plano");
    return;
  }

  const itens = montarItensPlano(formData, exercicioIds).map((item) => ({
    ...item,
    plano_id: id,
  }));

  const { error: erroItens } = await supabase.from("plano_exercicios").insert(itens);
  if (erroItens) {
    irComErro(erroItens.message, "plano");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  revalidatePath("/exercicios");
  irComSucesso("Plano atualizado", "plano");
}

export async function alternarAtivoPlano(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const ativoAtual = String(formData.get("ativo_atual") || "") === "true";

  const { error } = await supabase.from("planos").update({ ativo: !ativoAtual }).eq("id", id);
  if (error) {
    irComErro(error.message, "plano");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  revalidatePath("/exercicios");
  irComSucesso(ativoAtual ? "Plano desativado" : "Plano reativado", "plano");
}

export async function duplicarPlano(id: string) {
  const { supabase, user } = await exigirAdmin();

  const { data: planoOriginal, error: erroOriginal } = await supabase
    .from("planos")
    .select("titulo, paciente_id, plano_exercicios(exercicio_id, series, repeticoes, ordem)")
    .eq("id", id)
    .single();

  if (erroOriginal || !planoOriginal) {
    irComErro(erroOriginal?.message ?? "plano não encontrado", "plano");
    return;
  }

  const { data: novoPlano, error: erroNovo } = await supabase
    .from("planos")
    .insert({ paciente_id: planoOriginal.paciente_id, titulo: `${planoOriginal.titulo} (cópia)`, criado_por: user.id })
    .select()
    .single();

  if (erroNovo || !novoPlano) {
    irComErro(erroNovo?.message ?? "não foi possível duplicar o plano", "plano");
    return;
  }

  const itens = (planoOriginal.plano_exercicios ?? []).map((item: any) => ({
    plano_id: novoPlano.id,
    exercicio_id: item.exercicio_id,
    series: item.series,
    repeticoes: item.repeticoes,
    ordem: item.ordem,
  }));

  if (itens.length > 0) {
    const { error: erroItens } = await supabase.from("plano_exercicios").insert(itens);
    if (erroItens) irComErro(erroItens.message, "plano");
  }

  revalidatePath("/dashboard");
  irComSucesso("Plano duplicado", "plano");
}

/**
 * Apaga o plano de vez. Usado pra limpar plano de teste — desativar deixa
 * o plano na tela da fisio pra sempre.
 *
 * Seguro por causa das chaves estrangeiras já definidas no schema:
 * `plano_exercicios.plano_id` cai junto (on delete cascade) e
 * `sessoes.plano_id` vira nulo (on delete set null), então o histórico de
 * sessões da paciente continua existindo, só sem o vínculo com o plano.
 */
export async function removerPlano(id: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("planos").delete().eq("id", id);
  if (error) {
    // A aba se chama "plano", no singular: com o nome errado o painel não
    // reconhece a aba e cai na primeira da lista (a Biblioteca).
    irComErro(error.message, "plano");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  revalidatePath("/exercicios");
  irComSucesso("Plano removido", "plano");
}

export async function criarSessao(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const paciente_id = String(formData.get("paciente_id") || "");
  const data = String(formData.get("data") || "");
  const hora = String(formData.get("hora") || "") || null;
  const plano_id = String(formData.get("plano_id") || "") || null;
  const tipo = String(formData.get("tipo") || "tratamento");
  const especialidade = String(formData.get("especialidade") || "") || null;
  const modalidade = especialidade === "pelvica" ? String(formData.get("modalidade") || "presencial") : null;
  const observacoes = String(formData.get("observacoes") || "") || null;
  const filtroPaciente = String(formData.get("_filtro_paciente") || "") || undefined;
  const filtroDia = String(formData.get("_filtro_dia") || "") || undefined;

  if (!paciente_id || !data) {
    irComErro("selecione o paciente e a data", "agenda", { paciente: filtroPaciente, dia: filtroDia });
    return;
  }

  if (hora) {
    const conflito = await verificarConflito(supabase, { data, hora });
    if (conflito) {
      irComErro(conflito, "agenda", { paciente: filtroPaciente, dia: filtroDia });
      return;
    }
  }

  const { error } = await supabase.from("sessoes").insert({
    paciente_id,
    data,
    hora,
    plano_id,
    tipo,
    especialidade,
    modalidade,
    observacoes,
    criado_por: user.id,
  });

  if (error) {
    irComErro(error.message, "agenda", { paciente: filtroPaciente, dia: filtroDia });
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Sessão agendada com sucesso", "agenda", { paciente: filtroPaciente, dia: filtroDia });
}

export async function removerSessao(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const filtroPaciente = String(formData.get("_filtro_paciente") || "") || undefined;
  const filtroDia = String(formData.get("_filtro_dia") || "") || undefined;

  const { error } = await supabase.from("sessoes").delete().eq("id", id);
  if (error) {
    irComErro(error.message, "agenda", { paciente: filtroPaciente, dia: filtroDia });
    return;
  }
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Sessão removida", "agenda", { paciente: filtroPaciente, dia: filtroDia });
}

export async function criarBloqueioAgenda(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const data = String(formData.get("data") || "");
  const horaInicio = String(formData.get("hora_inicio") || "");
  const horaFim = String(formData.get("hora_fim") || "");
  const motivo = String(formData.get("motivo") || "").trim() || null;

  if (!data || !horaInicio || !horaFim) {
    irComErro("informe data, hora de início e hora de fim", "agenda");
    return;
  }

  if (horaFim <= horaInicio) {
    irComErro("a hora de fim precisa ser depois da hora de início", "agenda");
    return;
  }

  const { error } = await supabase.from("bloqueios_agenda").insert({
    data,
    hora_inicio: horaInicio,
    hora_fim: horaFim,
    motivo,
    criado_por: user.id,
  });

  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Horário bloqueado", "agenda");
}

export async function removerBloqueioAgenda(id: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("bloqueios_agenda").delete().eq("id", id);
  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Bloqueio removido", "agenda");
}

/**
 * Transforma o titulo em endereco de URL: "Dor Pélvica Pós-Parto" ->
 * "dor-pelvica-pos-parto". O slug entra na URL publica e no sitemap, entao
 * nao pode ter acento, espaco nem pontuacao.
 */
function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function criarPost(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const titulo = String(formData.get("titulo") || "").trim();
  if (!titulo) {
    irComErro("o post precisa de um título", "blog");
    return;
  }

  const publicado = formData.get("publicado") === "on";
  const baseSlug = gerarSlug(titulo) || "post";

  // Slug repetido derruba o insert pelo unique. Em vez de devolver um erro
  // de banco pra Beatriz, acrescenta um sufixo e segue.
  const { data: existentes } = await supabase
    .from("posts")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  const usados = new Set((existentes ?? []).map((p: any) => p.slug));
  let slug = baseSlug;
  let sufixo = 2;
  while (usados.has(slug)) slug = `${baseSlug}-${sufixo++}`;

  const { error } = await supabase.from("posts").insert({
    slug,
    titulo,
    resumo: String(formData.get("resumo") || "").trim() || null,
    conteudo: String(formData.get("conteudo") || ""),
    capa_url: String(formData.get("capa_arquivo_url") || "").trim() || null,
    link_externo: String(formData.get("link_externo") || "").trim() || null,
    publicado,
    publicado_em: publicado ? new Date().toISOString() : null,
    criado_por: user.id,
  });

  if (error) {
    irComErro(error.message, "blog");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/blog");
  revalidatePath("/");
  irComSucesso(publicado ? "Post publicado" : "Rascunho salvo", "blog");
}

export async function atualizarPost(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();

  const publicado = formData.get("publicado") === "on";

  const atualizacao: Record<string, unknown> = {
    titulo: String(formData.get("titulo") || "").trim(),
    resumo: String(formData.get("resumo") || "").trim() || null,
    conteudo: String(formData.get("conteudo") || ""),
    link_externo: String(formData.get("link_externo") || "").trim() || null,
    publicado,
  };

  const capaNova = String(formData.get("capa_arquivo_url") || "").trim();
  if (capaNova) atualizacao.capa_url = capaNova;

  // Primeira publicacao carimba a data; despublicar e republicar depois
  // mantem a data original, pra nao reordenar o blog sem motivo.
  const { data: atual } = await supabase.from("posts").select("publicado_em").eq("id", id).single();
  if (publicado && !atual?.publicado_em) {
    atualizacao.publicado_em = new Date().toISOString();
  }

  const { error } = await supabase.from("posts").update(atualizacao).eq("id", id);
  if (error) {
    irComErro(error.message, "blog");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/blog");
  revalidatePath("/");
  irComSucesso("Post atualizado", "blog");
}

export async function removerPost(id: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    irComErro(error.message, "blog");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/blog");
  revalidatePath("/");
  irComSucesso("Post removido", "blog");
}

export async function criarHorarioAtendimento(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const dias = formData.getAll("dia_semana").map((d) => Number(d));
  const horaInicio = String(formData.get("hora_inicio") || "");
  const horaFim = String(formData.get("hora_fim") || "");
  const intervalo = Number(formData.get("intervalo_minutos")) || 60;

  if (dias.length === 0) {
    irComErro("escolha pelo menos um dia da semana", "agenda");
    return;
  }
  if (!horaInicio || !horaFim) {
    irComErro("informe a hora de início e a hora de fim", "agenda");
    return;
  }
  if (horaFim <= horaInicio) {
    irComErro("a hora de fim precisa ser depois da hora de início", "agenda");
    return;
  }

  const { error } = await supabase.from("horarios_atendimento").insert(
    dias.map((dia) => ({
      dia_semana: dia,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      intervalo_minutos: intervalo,
      criado_por: user.id,
    }))
  );

  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso(
    dias.length > 1 ? `Horário aplicado a ${dias.length} dias` : "Horário de atendimento criado",
    "agenda"
  );
}

export async function alternarAtivoHorarioAtendimento(id: string, ativoAtual: boolean) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("horarios_atendimento")
    .update({ ativo: !ativoAtual })
    .eq("id", id);

  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso(ativoAtual ? "Horário desativado" : "Horário reativado", "agenda");
}

export async function removerHorarioAtendimento(id: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase.from("horarios_atendimento").delete().eq("id", id);
  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Horário removido", "agenda");
}

export async function marcarIndicacaoUsada(id: string) {
  const { supabase } = await exigirAdmin();

  const { error } = await supabase
    .from("indicacoes")
    .update({ status: "usada", usada_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    irComErro(error.message, "indicacoes");
    return;
  }

  revalidatePath("/dashboard");
  irComSucesso("Indicação marcada como usada", "indicacoes");
}

export async function aprovarSolicitacaoSessao(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();

  const horaAjustada = String(formData.get("hora") || "").trim() || null;

  const { data: sessaoAtual } = await supabase.from("sessoes").select("data, hora").eq("id", id).single();
  const horaFinal = horaAjustada || sessaoAtual?.hora || null;

  if (sessaoAtual && horaFinal) {
    const conflito = await verificarConflito(supabase, { data: sessaoAtual.data, hora: horaFinal, excluirSessaoId: id });
    if (conflito) {
      irComErro(conflito, "agenda");
      return;
    }
  }

  const atualizacao: Record<string, unknown> = { status: "agendada" };
  if (horaAjustada) atualizacao.hora = horaAjustada;

  const { data: sessao, error } = await supabase
    .from("sessoes")
    .update(atualizacao)
    .eq("id", id)
    .eq("status", "solicitada")
    .select("data, hora, tipo, perfis!paciente_id(nome, email)")
    .single();

  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  const paciente = (sessao as any)?.perfis;
  if (paciente?.email) {
    const dataFormatada = new Date(`${sessao.data}T00:00:00`).toLocaleDateString("pt-BR");
    await enviarEmail({
      destinatario: paciente.email,
      assunto: "Sua sessão foi confirmada",
      html: `
        <p>Olá, ${paciente.nome || ""}!</p>
        <p>Sua sessão de <strong>${rotuloTipoSessao(sessao.tipo)}</strong> foi agendada pra
        <strong>${dataFormatada}${sessao.hora ? ` às ${sessao.hora.slice(0, 5)}` : ""}</strong>.</p>
        <p>Entre no app pra confirmar sua presença.</p>
      `,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Sessão aprovada", "agenda");
}

export async function recusarSolicitacaoSessao(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();

  const motivo = String(formData.get("motivo") || "").trim() || null;

  const { data: sessao, error } = await supabase
    .from("sessoes")
    .update({ status: "rejeitada", motivo_recusa: motivo })
    .eq("id", id)
    .eq("status", "solicitada")
    .select("data, hora, tipo, perfis!paciente_id(nome, email)")
    .single();

  if (error) {
    irComErro(error.message, "agenda");
    return;
  }

  const paciente = (sessao as any)?.perfis;
  if (paciente?.email) {
    const dataFormatada = new Date(`${sessao.data}T00:00:00`).toLocaleDateString("pt-BR");
    await enviarEmail({
      destinatario: paciente.email,
      assunto: "Não foi possível agendar sua sessão",
      html: `
        <p>Olá, ${paciente.nome || ""}!</p>
        <p>Infelizmente não foi possível agendar sua sessão pra ${dataFormatada}${
        sessao.hora ? ` às ${sessao.hora.slice(0, 5)}` : ""
      }.</p>
        ${motivo ? `<p>Motivo: ${motivo}</p>` : ""}
        <p>Tente solicitar outro horário no app.</p>
      `,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Solicitação recusada", "agenda");
}

export async function criarConvitePaciente(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const idadeRaw = formData.get("idade");
  const idade = idadeRaw ? Number(idadeRaw) : null;
  const whatsapp = String(formData.get("whatsapp") || "").trim() || null;

  if (!nome || !email) return;

  const { data: perfilExistente } = await supabase
    .from("perfis")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (perfilExistente) {
    irComSucesso("Esse e-mail já tem uma conta vinculada", "pacientes");
  }

  const { data: conviteExistente } = await supabase
    .from("convites_paciente")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (conviteExistente) {
    irComSucesso("Já existe um convite pendente pra esse e-mail", "pacientes");
  }

  const { error } = await supabase.from("convites_paciente").insert({ nome, email, idade, whatsapp, criado_por: user.id });
  if (error) irComErro(error.message, "pacientes");

  revalidatePath("/dashboard");
  irComSucesso(`${nome} pré-cadastrado — vincula sozinho no primeiro login com Google`, "pacientes");
}

export async function removerConvitePaciente(id: string) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("convites_paciente").delete().eq("id", id);
  if (error) irComErro(error.message, "pacientes");
  revalidatePath("/dashboard");
  irComSucesso("Convite removido", "pacientes");
}

/**
 * WhatsApp da paciente, cadastrado pela Beatriz na ficha.
 *
 * Vai pelo cliente de serviço porque `perfis` não tem policy de UPDATE pra
 * ninguém — nem pra admin — e abrir uma seria deixar o papel e o arquivamento
 * expostos. O papel de admin é conferido em `exigirAdmin`.
 */
export async function atualizarWhatsappPaciente(pacienteId: string, formData: FormData) {
  await exigirAdmin();

  const whatsapp = String(formData.get("whatsapp") || "").trim() || null;

  const admin = createAdminClient();
  const { error } = await admin.from("perfis").update({ whatsapp }).eq("id", pacienteId);
  if (error) irComErro(error.message, "pacientes", { verPaciente: pacienteId });

  revalidatePath("/dashboard");
  irComSucesso(whatsapp ? "WhatsApp salvo" : "WhatsApp removido", "pacientes", { verPaciente: pacienteId });
}

export async function arquivarPaciente(id: string) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("perfis")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) irComErro(error.message, "pacientes", { paciente: id });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Paciente arquivado (alta registrada)", "pacientes", { paciente: id });
}

export async function desarquivarPaciente(id: string) {
  await exigirAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("perfis").update({ arquivado_em: null }).eq("id", id);
  if (error) irComErro(error.message, "pacientes", { paciente: id });

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Paciente reativado", "pacientes", { paciente: id });
}

export async function removerPaciente(id: string) {
  await exigirAdmin();
  const admin = createAdminClient();

  const { data: planos } = await admin.from("planos").select("id").eq("paciente_id", id);
  const planoIds = (planos ?? []).map((p) => p.id);

  if (planoIds.length > 0) {
    await admin.from("plano_exercicios").delete().in("plano_id", planoIds);
  }
  await admin.from("planos").delete().eq("paciente_id", id);
  await admin.from("sessoes").delete().eq("paciente_id", id);
  await admin.from("evolucoes").delete().eq("paciente_id", id);
  await admin.from("perfis").delete().eq("id", id);
  await admin.auth.admin.deleteUser(id);

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Paciente removido", "pacientes");
}

export async function criarEvolucao(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const paciente_id = String(formData.get("paciente_id") || "");
  const data = String(formData.get("data") || "") || new Date().toISOString().slice(0, 10);
  const texto = String(formData.get("texto") || "").trim();

  if (!paciente_id || !texto) {
    irComErro("escreva o texto da evolução", "pacientes", { verPaciente: paciente_id });
    return;
  }

  const { error } = await supabase.from("evolucoes").insert({ paciente_id, data, texto, criado_por: user.id });
  if (error) {
    irComErro(error.message, "pacientes", { verPaciente: paciente_id });
    return;
  }

  revalidatePath("/dashboard");
  irComSucesso("Evolução registrada", "pacientes", { verPaciente: paciente_id });
}

export async function removerEvolucao(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();
  const pacienteId = String(formData.get("_paciente_id") || "");

  const { error } = await supabase.from("evolucoes").delete().eq("id", id);
  if (error) {
    irComErro(error.message, "pacientes", { verPaciente: pacienteId });
    return;
  }

  revalidatePath("/dashboard");
  irComSucesso("Evolução removida", "pacientes", { verPaciente: pacienteId });
}

export async function criarDestaque(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const titulo = String(formData.get("titulo") || "").trim();
  const subtitulo = String(formData.get("subtitulo") || "").trim() || null;
  const linkUrl = String(formData.get("link_url") || "").trim() || null;
  const imagemUrl =
    String(formData.get("imagem_arquivo_url") || "").trim() ||
    String(formData.get("imagem_url") || "").trim() ||
    null;

  if (!titulo || !imagemUrl) {
    irComErro("título e imagem são obrigatórios", "destaques");
    return;
  }

  const { data: existentes } = await supabase
    .from("destaques")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1);
  const proximaOrdem = (existentes?.[0]?.ordem ?? -1) + 1;

  const { error } = await supabase.from("destaques").insert({
    titulo,
    subtitulo,
    imagem_url: imagemUrl,
    link_url: linkUrl,
    ordem: proximaOrdem,
    criado_por: user.id,
  });
  if (error) irComErro(error.message, "destaques");

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Destaque publicado", "destaques");
}

export async function atualizarDestaque(id: string, formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const atualizacao: Record<string, unknown> = {
    titulo: String(formData.get("titulo") || "").trim(),
    subtitulo: String(formData.get("subtitulo") || "").trim() || null,
    link_url: String(formData.get("link_url") || "").trim() || null,
  };

  const imagemNova =
    String(formData.get("imagem_arquivo_url") || "").trim() ||
    String(formData.get("imagem_url") || "").trim();
  if (imagemNova) atualizacao.imagem_url = imagemNova;

  const { error } = await supabase.from("destaques").update(atualizacao).eq("id", id);
  if (error) irComErro(error.message, "destaques");

  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Destaque atualizado", "destaques");
}

export async function removerDestaque(id: string) {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("destaques").delete().eq("id", id);
  if (error) irComErro(error.message, "destaques");
  revalidatePath("/dashboard");
  revalidatePath("/inicio");
  irComSucesso("Destaque removido", "destaques");
}
