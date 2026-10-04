"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enviarEmail } from "@/lib/email";
import { rotuloTipoSessao } from "@/lib/tiposSessao";

const TIPOS_POR_EXTENSAO: Record<string, string> = {
  gif: "image/gif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogg: "video/ogg",
};

function inferirContentType(nomeArquivo: string, tipoDetectado: string): string | undefined {
  if (tipoDetectado) return tipoDetectado;
  const extensao = nomeArquivo.split(".").pop()?.toLowerCase() || "";
  return TIPOS_POR_EXTENSAO[extensao];
}

function irComSucesso(mensagem: string, aba: string, extraParams: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ sucesso: mensagem, aba });
  for (const [chave, valor] of Object.entries(extraParams)) {
    if (valor) params.set(chave, valor);
  }
  redirect(`/dashboard?${params.toString()}`);
}

function irComErro(mensagem: string, aba: string, extraParams: Record<string, string | undefined> = {}) {
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

  let videoUrl = String(formData.get("video_url") || "") || null;

  const arquivo = formData.get("video_arquivo") as File | null;
  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "bin";
    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("exercicios")
      .upload(caminho, arquivo, { contentType: inferirContentType(arquivo.name, arquivo.type) });

    if (!erroUpload) {
      const { data: publicUrlData } = supabase.storage
        .from("exercicios")
        .getPublicUrl(caminho);
      videoUrl = publicUrlData.publicUrl;
    }
  }

  let pdfUrl = String(formData.get("pdf_url") || "") || null;

  const arquivoPdf = formData.get("pdf_arquivo") as File | null;
  if (arquivoPdf && arquivoPdf.size > 0) {
    const caminho = `${user.id}/${crypto.randomUUID()}.pdf`;

    const { error: erroUploadPdf } = await supabase.storage
      .from("exercicios")
      .upload(caminho, arquivoPdf, { contentType: "application/pdf" });

    if (!erroUploadPdf) {
      const { data: publicUrlData } = supabase.storage
        .from("exercicios")
        .getPublicUrl(caminho);
      pdfUrl = publicUrlData.publicUrl;
    }
  }

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

  const videoUrlDigitada = String(formData.get("video_url") || "").trim();
  const arquivo = formData.get("video_arquivo") as File | null;

  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "bin";
    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("exercicios")
      .upload(caminho, arquivo, { contentType: inferirContentType(arquivo.name, arquivo.type) });

    if (!erroUpload) {
      const { data: publicUrlData } = supabase.storage.from("exercicios").getPublicUrl(caminho);
      atualizacao.video_url = publicUrlData.publicUrl;
    }
  } else if (videoUrlDigitada) {
    atualizacao.video_url = videoUrlDigitada;
  }

  const pdfUrlDigitada = String(formData.get("pdf_url") || "").trim();
  const arquivoPdf = formData.get("pdf_arquivo") as File | null;

  if (arquivoPdf && arquivoPdf.size > 0) {
    const caminho = `${user.id}/${crypto.randomUUID()}.pdf`;

    const { error: erroUploadPdf } = await supabase.storage
      .from("exercicios")
      .upload(caminho, arquivoPdf, { contentType: "application/pdf" });

    if (!erroUploadPdf) {
      const { data: publicUrlData } = supabase.storage.from("exercicios").getPublicUrl(caminho);
      atualizacao.pdf_url = publicUrlData.publicUrl;
    }
  } else if (pdfUrlDigitada) {
    atualizacao.pdf_url = pdfUrlDigitada;
  }

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

  const itens = exercicioIds.map((exercicio_id, i) => ({
    plano_id: plano.id,
    exercicio_id,
    ordem: i,
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

  const itens = exercicioIds.map((exercicio_id, i) => ({
    plano_id: id,
    exercicio_id,
    ordem: i,
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

export async function aprovarSolicitacaoSessao(id: string, formData: FormData) {
  const { supabase } = await exigirAdmin();

  const horaAjustada = String(formData.get("hora") || "").trim() || null;

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
  let imagemUrl = String(formData.get("imagem_url") || "").trim() || null;

  const arquivo = formData.get("imagem_arquivo") as File | null;
  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "jpg";
    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("destaques")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });

    if (!erroUpload) {
      const { data: publicUrlData } = supabase.storage.from("destaques").getPublicUrl(caminho);
      imagemUrl = publicUrlData.publicUrl;
    }
  }

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

  const imagemUrlDigitada = String(formData.get("imagem_url") || "").trim();
  const arquivo = formData.get("imagem_arquivo") as File | null;

  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split(".").pop() || "jpg";
    const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("destaques")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });

    if (!erroUpload) {
      const { data: publicUrlData } = supabase.storage.from("destaques").getPublicUrl(caminho);
      atualizacao.imagem_url = publicUrlData.publicUrl;
    }
  } else if (imagemUrlDigitada) {
    atualizacao.imagem_url = imagemUrlDigitada;
  }

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
