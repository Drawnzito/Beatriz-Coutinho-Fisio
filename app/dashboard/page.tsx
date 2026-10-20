import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { Feedback } from "@/components/Feedback";
import { MantemPosicao } from "@/components/MantemPosicao";
import { PainelNavegacao } from "@/components/PainelNavegacao";
import {
  IconeAgenda,
  IconePacientes,
  IconeTreinos,
  IconeConteudo,
  IconeRelogio,
  IconeCadeado,
  IconeMais,
} from "@/components/IconesPainel";
import { SecaoRecolhivel } from "@/components/SecaoRecolhivel";
import { CartaoSessaoAgenda } from "@/components/CartaoSessaoAgenda";
import { CartaoSessaoResumo } from "@/components/CartaoSessaoResumo";
import { LinhaPaciente } from "@/components/LinhaPaciente";
import { MontarPlano } from "@/components/MontarPlano";
import { CampoCategoria } from "@/components/CampoCategoria";
import { SeletorPaciente } from "@/components/SeletorPaciente";
import { SeletorOpcao } from "@/components/SeletorOpcao";
import { TiraSemana } from "@/components/TiraSemana";
import { NavegacaoSemana } from "@/components/NavegacaoSemana";
import { DiaEmDestaque } from "@/components/DiaEmDestaque";
import { EstadoVazioAgenda } from "@/components/EstadoVazioAgenda";
import { CampoValidade } from "@/components/CampoValidade";
import { BadgeStatusSessao } from "@/components/BadgeStatusSessao";
import { BotaoPerigo } from "@/components/BotaoPerigo";
import { BotoesPdfEvolucao } from "@/components/BotoesPdfEvolucao";
import { Paginacao } from "@/components/Paginacao";
import { buscarNumerosSessao } from "@/lib/numeroSessao";
import { ResumoAvaliacoes } from "@/components/ResumoAvaliacoes";
import { PERGUNTAS_ATENDIMENTO, PERGUNTAS_APP } from "@/lib/avaliacoes";
import { CampoEspecialidade } from "@/components/CampoEspecialidade";
import { ChipEspecialidade } from "@/components/ChipEspecialidade";
import { WhatsappDoPaciente } from "@/components/WhatsappDoPaciente";
import { DIAS_SEMANA, rotuloDiaSemana } from "@/lib/diasSemana";
import { UploadArquivo } from "@/components/UploadArquivo";
import { EXTENSOES_MIDIA, EXTENSOES_IMAGEM, EXTENSOES_PASSO_A_PASSO } from "@/lib/tiposArquivo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { semanaAtual } from "@/lib/semana";
import { hojeIsoBrasil } from "@/lib/dataBrasil";
import { TIPOS_SESSAO, rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";
import {
  criarExercicio,
  removerExercicio,
  atualizarExercicio,
  criarAviso,
  removerAviso,
  criarPlano,
  atualizarPlano,
  alternarAtivoPlano,
  duplicarPlano,
  removerPlano,
  criarSessao,
  removerSessao,
  criarBloqueioAgenda,
  removerBloqueioAgenda,
  criarHorarioAtendimento,
  alternarAtivoHorarioAtendimento,
  removerHorarioAtendimento,
  marcarIndicacaoUsada,
  aprovarSolicitacaoSessao,
  recusarSolicitacaoSessao,
  criarConvitePaciente,
  removerConvitePaciente,
  criarDestaque,
  atualizarDestaque,
  removerDestaque,
  criarPost,
  atualizarPost,
  removerPost,
  arquivarPaciente,
  desarquivarPaciente,
  removerPaciente,
  criarEvolucao,
  removerEvolucao,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    sucesso?: string;
    aba?: string;
    paciente?: string;
    dia?: string;
    categoria?: string;
    editar?: string;
    busca?: string;
    ordem?: string;
    editarDestaque?: string;
    semana?: string;
    verPaciente?: string;
    buscaPaciente?: string;
    arquivados?: string;
    paginaExercicios?: string;
    paginaPacientes?: string;
    paginaSessoesPaciente?: string;
    editarPlano?: string;
    editarPost?: string;
  };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfilAtual } = await supabase
    .from("perfis")
    .select("papel, nome, email")
    .eq("id", user.id)
    .single();

  if (perfilAtual?.papel !== "admin") {
    redirect("/inicio");
  }

  const hojeIso = hojeIsoBrasil();
  const pacienteFiltro = searchParams.paciente || undefined;
  const semanaOffset = parseInt(searchParams.semana ?? "0", 10) || 0;
  const dias = semanaAtual(semanaOffset);
  const diaFiltro = dias.some((d) => d.iso === searchParams.dia)
    ? searchParams.dia!
    : semanaOffset === 0
    ? hojeIso
    : dias[0].iso;
  const diaInfo = dias.find((d) => d.iso === diaFiltro)!;

  const verArquivados = searchParams.arquivados === "1";
  const buscaPacienteFiltro = (searchParams.buscaPaciente || "").trim();
  const buscaFiltro = searchParams.busca || undefined;
  const ordem = searchParams.ordem === "desc" ? "desc" : "asc";

  const TAMANHO_PACIENTES = 15;
  const TAMANHO_SESSOES_PACIENTE = 10;
  const paginaPacientes = Math.max(1, parseInt(searchParams.paginaPacientes ?? "1", 10) || 1);
  const paginaSessoesPaciente = Math.max(1, parseInt(searchParams.paginaSessoesPaciente ?? "1", 10) || 1);

  // A Biblioteca agrupa por categoria aqui no servidor, em memória, e não
  // com um filtro por categoria no banco.
  //
  // Filtrar no banco exigia que o nome da categoria no link batesse exatamente
  // com o que está gravado — e não bate: a grade agrupa em minúsculas e sem
  // espaço nas pontas, enquanto no banco ainda há "Mobilidade" e "Exercício "
  // de antes da normalização. Nessas, clicar na categoria devolvia zero. Em
  // memória vale a mesma normalização dos dois lados, que é como "montar
  // treino" sempre funcionou.
  let consultaExercicios = supabase
    .from("exercicios")
    .select("*", { count: "exact" })
    .order("titulo", { ascending: ordem === "asc" })
    .limit(500);
  if (buscaFiltro) consultaExercicios = consultaExercicios.ilike("titulo", `%${buscaFiltro}%`);

  let consultaPacientesLista = supabase
    .from("perfis")
    .select("id, nome, email, idade, arquivado_em", { count: "exact" })
    .eq("papel", "paciente");
  consultaPacientesLista = verArquivados
    ? consultaPacientesLista.not("arquivado_em", "is", null).order("arquivado_em", { ascending: false })
    : consultaPacientesLista.is("arquivado_em", null).order("nome");
  if (buscaPacienteFiltro) {
    consultaPacientesLista = consultaPacientesLista.or(
      `nome.ilike.%${buscaPacienteFiltro}%,email.ilike.%${buscaPacienteFiltro}%`
    );
  }
  consultaPacientesLista = consultaPacientesLista.range(
    (paginaPacientes - 1) * TAMANHO_PACIENTES,
    paginaPacientes * TAMANHO_PACIENTES - 1
  );

  let listaSessoes = supabase
    .from("sessoes")
    .select(
      "id, data, hora, status, motivo_recusa, tipo, especialidade, modalidade, observacoes, paciente_id, perfis!paciente_id(nome, email), planos(titulo)"
    )
    .eq("data", diaFiltro)
    .order("hora", { ascending: true });
  if (pacienteFiltro) listaSessoes = listaSessoes.eq("paciente_id", pacienteFiltro);

  let contagemSemana = supabase
    .from("sessoes")
    .select("data")
    .gte("data", dias[0].iso)
    .lte("data", dias[6].iso);
  if (pacienteFiltro) contagemSemana = contagemSemana.eq("paciente_id", pacienteFiltro);

  const [
    { data: exercicios, count: totalExercicios },
    { data: pacientesAtivosTodos },
    { data: pacientesLista, count: totalPacientesLista },
    { data: avisos },
    { data: planos },
    { data: sessoes },
    { data: sessoesSemana },
    { data: convites },
    { data: destaques },
    { data: solicitacoes },
    { data: categoriasTodas },
    { data: exerciciosTodos },
    { data: avaliacoesAtendimento },
    { data: avaliacoesApp },
    { data: bloqueios },
    { data: indicacoes },
    { data: horariosAtendimento },
    { data: posts },
  ] = await Promise.all([
    consultaExercicios,
    supabase.from("perfis").select("id, nome, email, idade").eq("papel", "paciente").is("arquivado_em", null).order("nome"),
    consultaPacientesLista,
    supabase.from("avisos").select("*").order("criado_em", { ascending: false }),
    supabase
      .from("planos")
      .select("id, titulo, ativo, paciente_id, perfis!paciente_id(nome, email), plano_exercicios(exercicio_id, series, repeticoes, ordem)")
      .order("criado_em", { ascending: false }),
    listaSessoes,
    contagemSemana,
    supabase.from("convites_paciente").select("*").order("criado_em", { ascending: false }),
    supabase.from("destaques").select("*").order("ordem", { ascending: true }),
    supabase
      .from("sessoes")
      .select("id, data, hora, tipo, especialidade, modalidade, observacoes, perfis!paciente_id(nome, email)")
      .eq("status", "solicitada")
      .order("data", { ascending: true }),
    supabase.from("exercicios").select("categoria"),
    supabase
      .from("exercicios")
      .select("id, titulo, categoria, series_padrao, repeticoes_padrao")
      .order("titulo", { ascending: true }),
    supabase
      .from("avaliacoes_atendimento")
      .select("nota_1, nota_2, nota_3, comentario, criado_em, perfis!paciente_id(nome, email)")
      .order("criado_em", { ascending: false })
      .limit(50),
    supabase
      .from("avaliacoes_app")
      .select("nota_1, nota_2, nota_3, comentario, criado_em, perfis!paciente_id(nome, email)")
      .order("criado_em", { ascending: false })
      .limit(50),
    supabase
      .from("bloqueios_agenda")
      .select("*")
      .gte("data", hojeIso)
      .order("data", { ascending: true })
      .order("hora_inicio", { ascending: true }),
    supabase
      .from("indicacoes")
      .select("id, nome_indicada, contato_indicada, status, criado_em, usada_em, perfis!paciente_id(nome, email)")
      .order("criado_em", { ascending: false }),
    supabase
      .from("horarios_atendimento")
      .select("*")
      .order("dia_semana", { ascending: true })
      .order("hora_inicio", { ascending: true }),
    supabase
      .from("posts")
      .select("id, slug, titulo, resumo, conteudo, capa_url, link_externo, publicado, publicado_em")
      .order("criado_em", { ascending: false }),
  ]);

  const numerosSessao = await buscarNumerosSessao(supabase, (sessoes ?? []).map((s: any) => s.id));

  // Próxima sessão de cada paciente da página — é o que a Beatriz procura ao
  // bater o olho na lista, e sem isso ela precisava abrir ficha por ficha.
  // Só os 15 da página atual, numa consulta só.
  const idsDaPagina = (pacientesLista ?? []).map((p: any) => p.id);
  const { data: proximasDaLista } = idsDaPagina.length
    ? await supabase
        .from("sessoes")
        .select("paciente_id, data, hora")
        .in("paciente_id", idsDaPagina)
        .in("status", ["agendada", "confirmada"])
        .gte("data", hojeIso)
        .order("data", { ascending: true })
        .order("hora", { ascending: true })
    : { data: [] };

  const proximaPorPaciente = new Map<string, { data: string; hora: string | null }>();
  for (const s of proximasDaLista ?? []) {
    if (!proximaPorPaciente.has(s.paciente_id)) {
      proximaPorPaciente.set(s.paciente_id, { data: s.data, hora: s.hora });
    }
  }

  // Contadores nas abas: sem isso a Beatriz só descobre que chegou coisa nova
  // se abrir a aba por acaso.
  const indicacoesPendentes = (indicacoes ?? []).filter((i: any) => i.status === "pendente").length;

  const opcoesAtribuicao = [
    ...(pacientesAtivosTodos ?? []),
    { id: user.id, nome: `${perfilAtual?.nome || "Você"} (teste)`, email: perfilAtual?.email ?? "", idade: null },
  ];

  const verPacienteId = searchParams.verPaciente || undefined;

  let pacienteDetalhe: any = null;
  let sessoesDetalhe: any[] = [];
  let totalSessoesDetalhe = 0;
  let planosDetalhe: any[] = [];
  let evolucoesDetalhe: any[] = [];
  if (verPacienteId) {
    const [{ data: pd }, { data: sd, count: totalSd }, { data: pld }, { data: ed }] = await Promise.all([
      supabase.from("perfis").select("id, nome, email, idade, whatsapp, arquivado_em").eq("id", verPacienteId).maybeSingle(),
      supabase
        .from("sessoes")
        .select("id, data, hora, status, motivo_recusa, tipo, especialidade, modalidade, observacoes, planos(titulo)", { count: "exact" })
        .eq("paciente_id", verPacienteId)
        .order("data", { ascending: false })
        .range((paginaSessoesPaciente - 1) * TAMANHO_SESSOES_PACIENTE, paginaSessoesPaciente * TAMANHO_SESSOES_PACIENTE - 1),
      supabase.from("planos").select("id, titulo, ativo, validade").eq("paciente_id", verPacienteId).order("criado_em", { ascending: false }),
      supabase.from("evolucoes").select("id, data, texto").eq("paciente_id", verPacienteId).order("data", { ascending: false }),
    ]);
    pacienteDetalhe = pd;
    sessoesDetalhe = sd ?? [];
    totalSessoesDetalhe = totalSd ?? 0;
    planosDetalhe = pld ?? [];
    evolucoesDetalhe = ed ?? [];
  }

  function textoEvolucaoExpandivel(texto: string) {
    const LIMITE = 180;
    const estiloTexto: React.CSSProperties = {
      margin: "4px 0 0",
      fontSize: 13.5,
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    };

    if (texto.length <= LIMITE) {
      return <div style={estiloTexto}>{texto}</div>;
    }

    let corte = texto.slice(0, LIMITE);
    const ultimoEspaco = corte.lastIndexOf(" ");
    if (ultimoEspaco > 40) corte = corte.slice(0, ultimoEspaco);

    return (
      <div style={estiloTexto}>
        <details>
          <summary style={{ cursor: "pointer" }}>
            {corte}…{" "}
            <span style={{ color: "var(--cor-acento)", fontWeight: 600, fontSize: 12.5 }}>ver mais</span>
          </summary>
          <div style={{ marginTop: 6 }}>{texto}</div>
        </details>
      </div>
    );
  }

  function hrefPacientes(overrides: { verPaciente?: string; buscaPaciente?: string; arquivados?: string } = {}) {
    const params = new URLSearchParams({ aba: "pacientes" });
    const verPaciente = "verPaciente" in overrides ? overrides.verPaciente : verPacienteId;
    const busca = "buscaPaciente" in overrides ? overrides.buscaPaciente : searchParams.buscaPaciente;
    const arquivadosParam = "arquivados" in overrides ? overrides.arquivados : verArquivados ? "1" : undefined;
    if (verPaciente) params.set("verPaciente", verPaciente);
    if (busca) params.set("buscaPaciente", busca);
    if (arquivadosParam) params.set("arquivados", arquivadosParam);
    return `/dashboard?${params.toString()}`;
  }

  function hrefPacientesPagina(p: number) {
    const params = new URLSearchParams({ aba: "pacientes" });
    if (buscaPacienteFiltro) params.set("buscaPaciente", buscaPacienteFiltro);
    if (verArquivados) params.set("arquivados", "1");
    if (p > 1) params.set("paginaPacientes", String(p));
    return `/dashboard?${params.toString()}`;
  }

  function hrefSessoesPacientePagina(p: number) {
    const params = new URLSearchParams({ aba: "pacientes", verPaciente: verPacienteId || "" });
    if (p > 1) params.set("paginaSessoesPaciente", String(p));
    return `/dashboard?${params.toString()}`;
  }

  const contagens: Record<string, number> = {};
  for (const s of sessoesSemana ?? []) {
    contagens[s.data] = (contagens[s.data] ?? 0) + 1;
  }

  const categoriasDisponiveis = [...new Set((categoriasTodas ?? []).map((e) => e.categoria))].sort();
  const exerciciosFiltrados = exercicios ?? [];

  // Exercícios agrupados por categoria, pra Biblioteca abrir por grupo em vez
  // de uma lista alfabética única — era nela que a Beatriz precisava rolar
  // tudo pra achar um exercício de uma região do corpo.
  const exerciciosPorCategoria = new Map<string, any[]>();
  for (const ex of exerciciosFiltrados) {
    const chave = (ex.categoria || "sem categoria").trim().toLowerCase();
    if (!exerciciosPorCategoria.has(chave)) exerciciosPorCategoria.set(chave, []);
    exerciciosPorCategoria.get(chave)!.push(ex);
  }
  const categoriasOrdenadas = [...exerciciosPorCategoria.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "pt-BR")
  );

  // Em quantos treinos cada exercício é usado: ajuda a reconhecer o que é
  // base do atendimento e o que foi cadastrado e nunca usado.
  const usoPorExercicio = new Map<string, number>();
  for (const pl of planos ?? []) {
    for (const pe of (pl as any).plano_exercicios ?? []) {
      usoPorExercicio.set(pe.exercicio_id, (usoPorExercicio.get(pe.exercicio_id) ?? 0) + 1);
    }
  }

  const editandoId = searchParams.editar || undefined;
  const editarPlanoId = searchParams.editarPlano || undefined;
  const editandoDestaqueId = searchParams.editarDestaque || undefined;
  const hrefDestaques = (editar?: string) =>
    editar ? `/dashboard?aba=destaques&editarDestaque=${editar}` : "/dashboard?aba=destaques";

  const editandoPostId = searchParams.editarPost || undefined;
  const hrefBlog = ({ editarPost }: { editarPost?: string }) =>
    editarPost ? `/dashboard?aba=blog&editarPost=${editarPost}` : "/dashboard?aba=blog";

  function hrefBiblioteca(overrides: { editar?: string; busca?: string; ordem?: string }) {
    const params = new URLSearchParams({ aba: "biblioteca" });
    const editar = "editar" in overrides ? overrides.editar : editandoId;
    const busca = "busca" in overrides ? overrides.busca : buscaFiltro;
    const ordemAtual = "ordem" in overrides ? overrides.ordem : ordem;
    if (editar) params.set("editar", editar);
    if (busca) params.set("busca", busca);
    if (ordemAtual && ordemAtual !== "asc") params.set("ordem", ordemAtual);
    return `/dashboard?${params.toString()}`;
  }

  function hrefAgenda(overrides: { paciente?: string; dia?: string; semana?: string }) {
    const params = new URLSearchParams({ aba: "agenda" });
    const paciente = "paciente" in overrides ? overrides.paciente : pacienteFiltro;
    const dia = "dia" in overrides ? overrides.dia : diaFiltro;
    const semana = "semana" in overrides ? overrides.semana : semanaOffset ? String(semanaOffset) : undefined;
    if (paciente) params.set("paciente", paciente);
    if (dia) params.set("dia", dia);
    if (semana && semana !== "0") params.set("semana", semana);
    return `/dashboard?${params.toString()}`;
  }

  const hrefsSemana = Object.fromEntries(dias.map((d) => [d.iso, hrefAgenda({ dia: d.iso })]));

  return (
    <>
      <Feedback mensagem={searchParams.sucesso} />
      <MantemPosicao />
      <Header
        titulo="Beatriz Coutinho"
        subtitulo="Painel da fisioterapeuta"
        avatarUrl={user.user_metadata?.avatar_url}
        variante="boasVindas"
      />

      {/* Sem padding lateral: as abas precisam encostar nas bordas. */}
      <main className="conteudo" style={{ padding: "24px 0 100px" }}>
        <PainelNavegacao
          inicial={searchParams.aba}
          grupos={[
            { id: "atendimento", rotulo: "Agenda", icone: <IconeAgenda />, abas: ["agenda"] },
            {
              id: "pessoas",
              rotulo: "Pacientes",
              icone: <IconePacientes />,
              abas: ["pacientes", "indicacoes", "avaliacoes"],
            },
            { id: "treinos", rotulo: "Treinos", icone: <IconeTreinos />, abas: ["plano", "biblioteca"] },
            {
              id: "conteudo",
              rotulo: "Conteúdo",
              icone: <IconeConteudo />,
              abas: ["destaques", "avisos", "blog"],
            },
          ]}
          abas={[
            {
              id: "biblioteca",
              rotulo: "Biblioteca",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <SecaoRecolhivel
                    titulo="Adicionar exercício"
                    descricao="Entra na biblioteca e fica disponível pra qualquer treino"
                    icone={<IconeMais />}
                    tom="acao"
                  >
                  <form action={criarExercicio} style={{ display: "grid", gap: 10 }}>
                    <input name="titulo" placeholder="Nome do exercício" required style={campo} />
                    <CampoCategoria existentes={categoriasDisponiveis as string[]} estilo={campo} />
                    <textarea name="descricao" placeholder="Descrição / como executar" rows={3} style={campo} />
                    <UploadArquivo
                      nome="video_arquivo_url"
                      bucket="exercicios"
                      rotulo="Vídeo ou gif demonstrativo"
                      ajuda="GIF, foto ou vídeo direto da galeria. Até 50 MB."
                      extensoes={EXTENSOES_MIDIA}
                    />
                    <UploadArquivo
                      nome="pdf_arquivo_url"
                      bucket="exercicios"
                      rotulo="Passo a passo (opcional)"
                      ajuda="Imagem com as instruções. PDF também funciona."
                      extensoes={EXTENSOES_PASSO_A_PASSO}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <input name="series_padrao" type="number" placeholder="Séries padrão" style={campo} />
                      <input name="repeticoes_padrao" type="number" placeholder="Repetições padrão" style={campo} />
                    </div>
                    <button type="submit" style={botaoPrimario}>Adicionar à biblioteca</button>
                  </form>
                  </SecaoRecolhivel>

                  <form action="/dashboard" method="get" style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input type="hidden" name="aba" value="biblioteca" />
                    {ordem !== "asc" && <input type="hidden" name="ordem" value={ordem} />}
                    <input
                      name="busca"
                      defaultValue={buscaFiltro ?? ""}
                      placeholder="Buscar pelo nome do exercício…"
                      style={campo}
                    />
                    <button type="submit" style={botaoTextoPrimario}>buscar</button>
                    {buscaFiltro && (
                      <Link href={hrefBiblioteca({ busca: "" })} style={botaoTexto}>
                        limpar
                      </Link>
                    )}
                  </form>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: 0 }}>
                      {exerciciosFiltrados.length} exercício{exerciciosFiltrados.length === 1 ? "" : "s"}
                      {buscaFiltro ? ` encontrado${exerciciosFiltrados.length === 1 ? "" : "s"}` : ""}
                      {" em "}
                      {categoriasOrdenadas.length} categoria{categoriasOrdenadas.length === 1 ? "" : "s"}
                    </p>
                    <Link href={hrefBiblioteca({ ordem: ordem === "asc" ? "desc" : "asc" })} style={{ ...botaoTexto, marginLeft: "auto" }}>
                      {ordem === "asc" ? "A → Z" : "Z → A"}
                    </Link>
                  </div>

                  {/* Cada categoria abre e fecha no lugar, sem trocar de tela.
                      Com busca ativa, ou editando um exercício, a categoria
                      correspondente já vem aberta. */}
                  {categoriasOrdenadas.map(([nomeCategoria, lista]) => (
                    <SecaoRecolhivel
                      key={nomeCategoria}
                      titulo={nomeCategoria}
                      contador={lista.length}
                      comecarAberta={
                        Boolean(buscaFiltro) ||
                        categoriasOrdenadas.length === 1 ||
                        lista.some((ex: any) => ex.id === editandoId)
                      }
                    >
                  <div style={{ display: "grid", gap: 10 }}>
                    {lista.map((ex: any) =>
                      ex.id === editandoId ? (
                        <div key={ex.id} style={{ ...cartao, display: "block" }}>
                          <form action={atualizarExercicio.bind(null, ex.id)} style={{ display: "grid", gap: 10 }}>
                            <input name="titulo" defaultValue={ex.titulo} required style={campo} />
                            <CampoCategoria
                              existentes={categoriasDisponiveis as string[]}
                              valorInicial={ex.categoria}
                              estilo={campo}
                            />
                            <textarea name="descricao" defaultValue={ex.descricao ?? ""} rows={3} style={campo} />
                            <UploadArquivo
                              nome="video_arquivo_url"
                              bucket="exercicios"
                              rotulo="Vídeo ou gif demonstrativo"
                              ajuda="Escolha outro arquivo só se quiser trocar."
                              extensoes={EXTENSOES_MIDIA}
                              urlAtual={ex.video_url}
                            />
                            <UploadArquivo
                              nome="pdf_arquivo_url"
                              bucket="exercicios"
                              rotulo="Passo a passo (opcional)"
                              ajuda="Escolha outro arquivo só se quiser trocar."
                              extensoes={EXTENSOES_PASSO_A_PASSO}
                              urlAtual={ex.pdf_url}
                            />
                            <div style={{ display: "flex", gap: 10 }}>
                              <input
                                name="series_padrao"
                                type="number"
                                placeholder="Séries padrão"
                                defaultValue={ex.series_padrao ?? ""}
                                style={campo}
                              />
                              <input
                                name="repeticoes_padrao"
                                type="number"
                                placeholder="Repetições padrão"
                                defaultValue={ex.repeticoes_padrao ?? ""}
                                style={campo}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <button type="submit" style={botaoPrimario}>Salvar alterações</button>
                              <Link href={hrefBiblioteca({ editar: "" })} style={{ ...botaoTexto, alignSelf: "center" }}>
                                cancelar
                              </Link>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div key={ex.id} style={cartao}>
                          <div style={{ flex: 1 }}>
                            <strong>{ex.titulo}</strong>{" "}
                            <span style={{ fontSize: 12, color: "var(--cor-acento)" }}>{ex.categoria}</span>
                            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                              {ex.series_padrao ?? "-"}x{ex.repeticoes_padrao ?? "-"} rep
                              {" · "}
                              {usoPorExercicio.get(ex.id)
                                ? `em ${usoPorExercicio.get(ex.id)} treino${usoPorExercicio.get(ex.id) === 1 ? "" : "s"}`
                                : "nunca usado"}
                            </p>
                            {ex.video_url && (
                              <div style={{ marginTop: 8, maxWidth: 220 }}>
                                <MidiaExercicio url={ex.video_url} />
                              </div>
                            )}
                          </div>
                          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                            <Link href={hrefBiblioteca({ editar: ex.id })} style={botaoTexto}>
                              editar
                            </Link>
                            <form action={removerExercicio.bind(null, ex.id)}>
                              <button type="submit" style={botaoTexto}>remover</button>
                            </form>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                    </SecaoRecolhivel>
                  ))}

                  {exerciciosFiltrados.length === 0 && (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                      {buscaFiltro ? "Nenhum exercício com esse nome." : "Nenhum exercício cadastrado ainda."}
                    </p>
                  )}
                </div>
              ),
            },
            {
              id: "pacientes",
              rotulo: "Pacientes",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  {pacienteDetalhe ? (
                    <div>
                      <Link href={hrefPacientes({ verPaciente: "" })} style={{ ...botaoTexto, display: "inline-block", marginBottom: 16 }}>
                        ← voltar à lista
                      </Link>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
                        <div>
                          <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 20, color: "var(--cor-primaria)" }}>
                            {pacienteDetalhe.nome || pacienteDetalhe.email}
                          </strong>
                          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
                            {pacienteDetalhe.email}
                            {pacienteDetalhe.idade ? ` · ${pacienteDetalhe.idade} anos` : ""}
                          </p>
                          {/* Editável aqui de propósito: a paciente quase nunca
                              preenche o próprio WhatsApp, e a Beatriz já tem o
                              número no celular dela. Antes isto era só um texto
                              "Sem WhatsApp cadastrado", sem saída. */}
                          <div style={{ marginTop: 4 }}>
                            <WhatsappDoPaciente
                              pacienteId={pacienteDetalhe.id}
                              valorInicial={pacienteDetalhe.whatsapp}
                            />
                          </div>
                          <p style={{ margin: "6px 0 0", fontSize: 12.5 }}>
                            {pacienteDetalhe.arquivado_em ? (
                              <span style={{ color: "#a2334a", fontWeight: 700 }}>
                                Arquivado (alta) em {new Date(pacienteDetalhe.arquivado_em).toLocaleDateString("pt-BR")}
                              </span>
                            ) : (
                              <span style={{ color: "#2f7a4f", fontWeight: 700 }}>Ativo</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                        {pacienteDetalhe.arquivado_em ? (
                          <form action={desarquivarPaciente.bind(null, pacienteDetalhe.id)}>
                            <button type="submit" style={botaoPrimario}>Reativar paciente</button>
                          </form>
                        ) : (
                          <form action={arquivarPaciente.bind(null, pacienteDetalhe.id)}>
                            <button type="submit" style={botaoSecundario}>Dar alta (arquivar)</button>
                          </form>
                        )}
                        <form action={removerPaciente.bind(null, pacienteDetalhe.id)}>
                          <BotaoPerigo
                            style={botaoPerigo}
                            mensagemConfirmacao={`Remover ${pacienteDetalhe.nome || pacienteDetalhe.email} definitivamente? Isso apaga o login, os planos e todo o histórico de sessões dele(a). Não tem como desfazer.`}
                          >
                            Remover paciente
                          </BotaoPerigo>
                        </form>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: 0 }}>
                          Evolução ({evolucoesDetalhe.length})
                        </p>
                        {evolucoesDetalhe.length > 0 && (
                          <BotoesPdfEvolucao pacienteId={pacienteDetalhe.id} nomePaciente={pacienteDetalhe.nome || pacienteDetalhe.email} />
                        )}
                      </div>

                      <form action={criarEvolucao} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                        <input type="hidden" name="paciente_id" value={pacienteDetalhe.id} />
                        <input name="data" type="date" defaultValue={hojeIso} style={campo} />
                        <textarea
                          name="texto"
                          placeholder="Como foi a sessão? Houve melhora? Observações relevantes..."
                          rows={3}
                          required
                          style={campo}
                        />
                        <button type="submit" style={{ ...botaoPrimario, justifySelf: "start" }}>
                          Registrar evolução
                        </button>
                      </form>

                      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
                        {evolucoesDetalhe.map((e) => (
                          <div key={e.id} style={{ ...cartao, alignItems: "flex-start" }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ fontSize: 13 }}>
                                {new Date(`${e.data}T00:00:00`).toLocaleDateString("pt-BR")}
                              </strong>
                              {textoEvolucaoExpandivel(e.texto)}
                            </div>
                            <form action={removerEvolucao.bind(null, e.id)}>
                              <input type="hidden" name="_paciente_id" value={pacienteDetalhe.id} />
                              <button type="submit" style={botaoTexto}>remover</button>
                            </form>
                          </div>
                        ))}
                        {evolucoesDetalhe.length === 0 && (
                          <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5 }}>Nenhuma evolução registrada ainda.</p>
                        )}
                      </div>

                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                        Planos ({planosDetalhe.length})
                      </p>
                      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
                        {planosDetalhe.map((pl) => (
                          <div key={pl.id} style={cartao}>
                            <div>
                              <strong>{pl.titulo}</strong>
                              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                                {pl.ativo ? "ativo" : "inativo"}
                                {pl.validade ? ` · válido até ${new Date(`${pl.validade}T00:00:00`).toLocaleDateString("pt-BR")}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                        {planosDetalhe.length === 0 && (
                          <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5 }}>Nenhum plano criado ainda.</p>
                        )}
                      </div>

                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                        Histórico de sessões ({totalSessoesDetalhe})
                      </p>
                      <div className="grade-auto grade-auto--2">
                        {sessoesDetalhe.map((s) => (
                          <CartaoSessaoResumo
                            key={s.id}
                            sessao={s}
                            detalhe={
                              [s.planos?.titulo ? `Plano: ${s.planos.titulo}` : null, s.observacoes]
                                .filter(Boolean)
                                .join(" · ") || undefined
                            }
                          />
                        ))}
                        {sessoesDetalhe.length === 0 && (
                          <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5 }}>Nenhuma sessão registrada ainda.</p>
                        )}
                      </div>

                      <Paginacao
                        pagina={paginaSessoesPaciente}
                        total={totalSessoesDetalhe}
                        tamanhoPagina={TAMANHO_SESSOES_PACIENTE}
                        hrefPagina={hrefSessoesPacientePagina}
                      />
                    </div>
                  ) : (
                    <>
                      <SecaoRecolhivel
                        titulo="Cadastrar paciente"
                        descricao="Pré-cadastro: entra na lista sozinho no primeiro login"
                        contador={(convites ?? []).length}
                        icone={<IconeMais />}
                        tom="acao"
                      >
                        <form action={criarConvitePaciente} style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                          <input name="nome" placeholder="Nome do paciente" required style={campo} />
                          <div style={{ display: "flex", gap: 10 }}>
                            <input name="idade" type="number" placeholder="Idade (opcional)" style={campo} />
                            <input name="email" type="email" placeholder="E-mail do Google" required style={campo} />
                          </div>
                          <input name="whatsapp" placeholder="WhatsApp (opcional)" style={campo} />
                          <button type="submit" style={botaoPrimario}>Pré-cadastrar paciente</button>
                          <p style={{ margin: 0, fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                            Ele entra pra lista assim que fizer login com esse mesmo e-mail no Google — não precisa
                            convite por link nem senha.
                          </p>
                        </form>

                        {!verArquivados && (convites ?? []).length > 0 && (
                          <>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                              Aguardando primeiro login
                            </p>
                            <div style={{ display: "grid", gap: 10 }}>
                              {(convites ?? []).map((c) => (
                                <div key={c.id} style={cartao}>
                                  <div>
                                    <strong>{c.nome}</strong>
                                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                      {c.email}
                                      {c.idade ? ` · ${c.idade} anos` : ""} · pendente
                                    </p>
                                  </div>
                                  <form action={removerConvitePaciente.bind(null, c.id)}>
                                    <button type="submit" style={botaoTexto}>remover</button>
                                  </form>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </SecaoRecolhivel>

                      <form action="/dashboard" method="get" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <input type="hidden" name="aba" value="pacientes" />
                        {verArquivados && <input type="hidden" name="arquivados" value="1" />}
                        <input
                          name="buscaPaciente"
                          defaultValue={searchParams.buscaPaciente ?? ""}
                          placeholder="Buscar por nome ou e-mail…"
                          style={campo}
                        />
                        <button type="submit" style={botaoTextoPrimario}>buscar</button>
                        {buscaPacienteFiltro && (
                          <Link href={hrefPacientes({ buscaPaciente: "" })} style={botaoTexto}>limpar</Link>
                        )}
                      </form>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: 0 }}>
                          {verArquivados ? `Pacientes arquivados (${totalPacientesLista ?? 0})` : `Pacientes ativos (${totalPacientesLista ?? 0})`}
                        </p>
                        <Link href={hrefPacientes({ arquivados: verArquivados ? "" : "1" })} style={botaoTexto}>
                          {verArquivados ? "ver ativos" : "ver arquivados"}
                        </Link>
                      </div>

                      {/* Linha enxuta: nome e próxima sessão. E-mail e idade
                          ficam na ficha — na lista só ocupavam espaço. */}
                      <div className="grade-auto grade-auto--2">
                        {(pacientesLista ?? []).map((p: any) => (
                          <LinhaPaciente
                            key={p.id}
                            nome={p.nome || p.email}
                            href={hrefPacientes({ verPaciente: p.id })}
                            proxima={proximaPorPaciente.get(p.id)}
                          />
                        ))}
                        {(pacientesLista ?? []).length === 0 && (
                          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                            {verArquivados ? "Nenhum paciente arquivado." : "Nenhum paciente logou ainda."}
                          </p>
                        )}
                      </div>

                      <Paginacao
                        pagina={paginaPacientes}
                        total={totalPacientesLista ?? 0}
                        tamanhoPagina={TAMANHO_PACIENTES}
                        hrefPagina={hrefPacientesPagina}
                      />
                    </>
                  )}
                </div>
              ),
            },
            {
              id: "plano",
              rotulo: "Montar plano",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  {opcoesAtribuicao.length === 0 ? (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                      Nenhum paciente logou ainda — peça pra ele entrar com Google uma vez no app.
                    </p>
                  ) : (
                    <SecaoRecolhivel
                      titulo="Montar novo treino"
                      descricao="Escolher os exercícios, a ordem e as repetições"
                      icone={<IconeMais />}
                      tom="acao"
                      comecarAberta={!editarPlanoId}
                    >
                      <MontarPlano
                        acao={criarPlano}
                        pacientes={opcoesAtribuicao}
                        exercicios={(exerciciosTodos ?? []) as any}
                        rotuloBotao="Criar treino"
                      />
                    </SecaoRecolhivel>
                  )}

                  <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                    {(planos ?? []).map((pl: any) =>
                      pl.id === editarPlanoId ? (
                        <div key={pl.id} style={{ ...cartao, display: "block" }}>
                          <p style={{ margin: "0 0 12px", fontSize: 12.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--cor-primaria-escura)" }}>
                            Editando · {pl.perfis?.nome || pl.perfis?.email}
                          </p>
                          <MontarPlano
                            acao={atualizarPlano.bind(null, pl.id)}
                            exercicios={(exerciciosTodos ?? []) as any}
                            tituloInicial={pl.titulo}
                            itensIniciais={[...(pl.plano_exercicios ?? [])]
                              .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
                              .map((pe: any) => ({
                                exercicio_id: pe.exercicio_id,
                                series: pe.series,
                                repeticoes: pe.repeticoes,
                              }))}
                            rotuloBotao="Salvar alterações"
                            cancelarHref="/dashboard?aba=plano"
                          />
                        </div>
                      ) : (
                      // Empilhado em vez de lado a lado: com quatro ações, a
                      // linha de botões não cabia ao lado do título no celular
                      // e quebrava torta sobre o texto.
                      <div
                        key={pl.id}
                        style={{
                          display: "block",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: "1px solid var(--cor-borda)",
                          background: "var(--cor-superficie)",
                          opacity: pl.ativo ? 1 : 0.62,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 14 }}>{pl.titulo}</strong>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: 0.3,
                              background: pl.ativo ? "var(--cor-acento-suave)" : "var(--cor-borda)",
                              color: pl.ativo ? "var(--cor-acento)" : "var(--cor-texto-suave)",
                            }}
                          >
                            {pl.ativo ? "ATIVO" : "INATIVO"}
                          </span>
                        </div>

                        <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                          {pl.perfis?.nome || pl.perfis?.email}
                          {" · "}
                          {(pl.plano_exercicios ?? []).length} exercício
                          {(pl.plano_exercicios ?? []).length === 1 ? "" : "s"}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid var(--cor-borda)",
                          }}
                        >
                          <Link href={`/dashboard?aba=plano&editarPlano=${pl.id}`} style={botaoTexto}>
                            editar
                          </Link>
                          <form action={duplicarPlano.bind(null, pl.id)}>
                            <button type="submit" style={botaoTexto}>duplicar</button>
                          </form>
                          <form action={alternarAtivoPlano.bind(null, pl.id)}>
                            <input type="hidden" name="ativo_atual" value={String(pl.ativo)} />
                            <button type="submit" style={botaoTexto}>{pl.ativo ? "desativar" : "reativar"}</button>
                          </form>
                          <form action={removerPlano.bind(null, pl.id)} style={{ marginLeft: "auto" }}>
                            <BotaoPerigo
                              mensagemConfirmacao={
                                `Remover o plano "${pl.titulo}" de vez?\n\n` +
                                `Os exercícios do plano são apagados junto. ` +
                                `As sessões já registradas continuam no histórico, ` +
                                `só deixam de apontar pra esse plano.\n\nIsso não tem volta.`
                              }
                              style={{ ...botaoTexto, color: "#a2334a", fontWeight: 600 }}
                            >
                              remover
                            </BotaoPerigo>
                          </form>
                        </div>
                      </div>
                      )
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: "agenda",
              rotulo: "Agenda",
              pendencias: (solicitacoes ?? []).length,
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                    <SeletorPaciente
                      pacientes={opcoesAtribuicao}
                      selecionado={pacienteFiltro}
                      baseHref="/dashboard"
                      manterParams={{ aba: "agenda", dia: diaFiltro, semana: semanaOffset ? String(semanaOffset) : undefined }}
                      placeholder="Todos os pacientes"
                    />

                    <NavegacaoSemana
                      inicioIso={dias[0].iso}
                      fimIso={dias[6].iso}
                      hrefAnterior={hrefAgenda({ semana: String(semanaOffset - 1), dia: "" })}
                      hrefProxima={hrefAgenda({ semana: String(semanaOffset + 1), dia: "" })}
                      hrefHoje={hrefAgenda({ semana: "0", dia: "" })}
                      emSemanaAtual={semanaOffset === 0}
                    />

                    <DiaEmDestaque
                      numero={diaInfo.numero}
                      rotulo={`${diaInfo.nomeCompleto}${diaInfo.hoje ? " · Hoje" : ""}`}
                      contagem={(sessoes ?? []).length}
                    />

                    <TiraSemana dias={dias} hrefs={hrefsSemana} selecionado={diaFiltro} contagens={contagens} />

                    {semanaOffset === 0 && diaFiltro !== hojeIso && (
                      <a
                        href={hrefAgenda({ dia: hojeIso, semana: "0" })}
                        style={{ fontSize: 12.5, color: "var(--cor-acento)", justifySelf: "start" }}
                      >
                        voltar pra hoje
                      </a>
                    )}
                  </div>

                  <SecaoRecolhivel
                    titulo="Horários de atendimento"
                    descricao="As vagas que as pacientes veem ao pedir uma sessão"
                    contador={(horariosAtendimento ?? []).length}
                    icone={<IconeRelogio />}
                  >
                    <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                      Horário já confirmado some da grade delas; horário que alguém pediu aparece em amarelo.
                    </p>

                    <form action={criarHorarioAtendimento} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                      <div style={{ display: "grid", gap: 5 }}>
                        <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>
                          Dias da semana
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {DIAS_SEMANA.map((dia) => (
                            <label
                              key={dia.valor}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: "1px solid var(--cor-borda)",
                                background: "var(--cor-superficie)",
                                fontSize: 12.5,
                                cursor: "pointer",
                              }}
                            >
                              <input type="checkbox" name="dia_semana" value={dia.valor} />
                              {dia.curto}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 110 }}>
                          <label style={{ fontSize: 12, color: "var(--cor-texto-suave)" }}>Começa</label>
                          <input name="hora_inicio" type="time" required defaultValue="08:00" style={campo} />
                        </div>
                        <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 110 }}>
                          <label style={{ fontSize: 12, color: "var(--cor-texto-suave)" }}>Termina</label>
                          <input name="hora_fim" type="time" required defaultValue="18:00" style={campo} />
                        </div>
                        <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 130 }}>
                          <label style={{ fontSize: 12, color: "var(--cor-texto-suave)" }}>Duração da sessão</label>
                          <select name="intervalo_minutos" defaultValue="60" style={campo}>
                            <option value="30">30 minutos</option>
                            <option value="45">45 minutos</option>
                            <option value="60">1 hora</option>
                            <option value="90">1h30</option>
                            <option value="120">2 horas</option>
                          </select>
                        </div>
                      </div>

                      <button type="submit" style={botaoPrimario}>Adicionar horário</button>
                    </form>

                    {(horariosAtendimento ?? []).length === 0 ? (
                      <p style={{ margin: 0, fontSize: 13, color: "var(--cor-acento)" }}>
                        Nenhum horário cadastrado — as pacientes vão poder sugerir qualquer hora,
                        e você confirma na aprovação.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {horariosAtendimento!.map((h: any) => (
                          <div key={h.id} style={{ ...cartao, opacity: h.ativo ? 1 : 0.55 }}>
                            <div>
                              <strong style={{ fontSize: 13.5 }}>
                                {rotuloDiaSemana(h.dia_semana)}
                                {" · "}
                                {h.hora_inicio.slice(0, 5)}–{h.hora_fim.slice(0, 5)}
                              </strong>
                              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                                Sessões de {h.intervalo_minutos} min
                                {!h.ativo && " · desativado"}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <form action={alternarAtivoHorarioAtendimento.bind(null, h.id, h.ativo)}>
                                <button type="submit" style={botaoTexto}>
                                  {h.ativo ? "desativar" : "reativar"}
                                </button>
                              </form>
                              <form action={removerHorarioAtendimento.bind(null, h.id)}>
                                <button type="submit" style={botaoTexto}>remover</button>
                              </form>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SecaoRecolhivel>

                  <SecaoRecolhivel
                    titulo="Bloquear agenda"
                    descricao="Férias, compromisso ou intervalo: some da grade das pacientes"
                    contador={(bloqueios ?? []).length}
                    icone={<IconeCadeado />}
                  >
                    <form action={criarBloqueioAgenda} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input name="data" type="date" required defaultValue={diaFiltro ?? ""} style={campo} />
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input name="hora_inicio" type="time" required style={campo} />
                        <input name="hora_fim" type="time" required style={campo} />
                      </div>
                      <input name="motivo" placeholder="Motivo (opcional, ex: consulta médica)" style={campo} />
                      <button type="submit" style={botaoPrimario}>Bloquear horário</button>
                      <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
                        Ninguém vai conseguir ver nem solicitar sessão nesse período.
                      </p>
                    </form>

                    {(bloqueios ?? []).length > 0 && (
                      <div style={{ display: "grid", gap: 8 }}>
                        {bloqueios!.map((b: any) => (
                          <div key={b.id} style={cartao}>
                            <div>
                              <strong>
                                {new Date(`${b.data}T00:00:00`).toLocaleDateString("pt-BR")}
                                {" · "}
                                {b.hora_inicio.slice(0, 5)}–{b.hora_fim.slice(0, 5)}
                              </strong>
                              {b.motivo && (
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>{b.motivo}</p>
                              )}
                            </div>
                            <form action={removerBloqueioAgenda.bind(null, b.id)}>
                              <button type="submit" style={botaoTexto}>remover</button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </SecaoRecolhivel>

                  {(solicitacoes ?? []).length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                        Solicitações pendentes ({solicitacoes!.length})
                      </p>
                      <div style={{ display: "grid", gap: 10 }}>
                        {solicitacoes!.map((s: any) => (
                          <div key={s.id} style={{ ...cartao, alignItems: "flex-start", borderColor: "#d8c276" }}>
                            <div>
                              <strong>
                                {new Date(`${s.data}T00:00:00`).toLocaleDateString("pt-BR")}
                                {s.hora ? ` às ${s.hora.slice(0, 5)}` : " · sem horário definido"}
                              </strong>
                              <p style={{ margin: "6px 0 0", fontSize: 13.5, fontWeight: 700 }}>
                                {s.perfis?.nome || s.perfis?.email}
                              </p>
                              {s.especialidade && (
                                <div style={{ margin: "6px 0 0" }}>
                                  <ChipEspecialidade especialidade={s.especialidade} modalidade={s.modalidade} />
                                </div>
                              )}
                              <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                                {rotuloTipoSessao(s.tipo)}
                              </p>
                              {s.observacoes && <p style={{ margin: "4px 0 0", fontSize: 13 }}>{s.observacoes}</p>}

                              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                                <form action={aprovarSolicitacaoSessao.bind(null, s.id)} style={{ display: "flex", gap: 6 }}>
                                  {!s.hora && <input name="hora" type="time" style={{ ...campo, padding: "6px 8px", fontSize: 12.5 }} />}
                                  <button type="submit" style={{ ...botaoPrimario, padding: "7px 12px", fontSize: 12.5 }}>
                                    Aprovar
                                  </button>
                                </form>
                                <form action={recusarSolicitacaoSessao.bind(null, s.id)} style={{ display: "flex", gap: 6 }}>
                                  <input name="motivo" placeholder="Motivo (opcional)" style={{ ...campo, padding: "6px 8px", fontSize: 12.5, width: 160 }} />
                                  <button type="submit" style={botaoTexto}>Recusar</button>
                                </form>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recolhido: o formulário inteiro antes das sessões do dia
                      empurrava a agenda pra fora da tela, e marcar sessão é
                      coisa pontual perto de só olhar o dia. */}
                  <SecaoRecolhivel
                    titulo="Agendar sessão"
                    descricao="Marcar direto, sem esperar a paciente pedir"
                    icone={<IconeMais />}
                    tom="acao"
                  >
                  {opcoesAtribuicao.length === 0 ? (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 14, margin: 0 }}>
                      Nenhum paciente logou ainda — peça pra ele entrar com Google uma vez no app.
                    </p>
                  ) : (
                    <form action={criarSessao} style={{ display: "grid", gap: 10 }}>
                      <input type="hidden" name="_filtro_paciente" value={pacienteFiltro ?? ""} />
                      <input type="hidden" name="_filtro_dia" value={diaFiltro ?? ""} />

                      <select name="paciente_id" required defaultValue={pacienteFiltro ?? ""} style={campo}>
                        <option value="">Selecione o paciente</option>
                        {opcoesAtribuicao.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome || p.email}
                          </option>
                        ))}
                      </select>

                      <div style={{ display: "flex", gap: 10 }}>
                        <input name="data" type="date" required defaultValue={diaFiltro ?? ""} style={campo} />
                        <input name="hora" type="time" style={campo} />
                      </div>

                      <select name="tipo" defaultValue="tratamento" style={campo}>
                        {TIPOS_SESSAO.map((t) => (
                          <option key={t.valor} value={t.valor}>
                            {t.rotulo}
                          </option>
                        ))}
                      </select>

                      <select name="plano_id" style={campo}>
                        <option value="">Sem plano vinculado (opcional)</option>
                        {(planos ?? []).map((pl: any) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.titulo} — {pl.perfis?.nome || pl.perfis?.email}
                          </option>
                        ))}
                      </select>

                      <CampoEspecialidade style={campo} obrigatorio={false} />

                      <textarea name="observacoes" placeholder="Observações (opcional)" rows={2} style={campo} />

                      <button type="submit" style={botaoPrimario}>Agendar sessão</button>
                    </form>
                  )}
                  </SecaoRecolhivel>

                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "20px 0 10px" }}>
                    {(sessoes ?? []).length > 0
                      ? `Sessões do dia (${sessoes!.length})`
                      : "Sessões do dia"}
                  </p>

                  <div className="grade-auto grade-auto--2">
                    {/* Compacto por padrão: hora, paciente e situação resolvem
                        o "quem vem agora". Especialidade, plano, observações e
                        remover ficam a um toque, dentro do próprio cartão. */}
                    {(sessoes ?? []).map((s: any) => (
                      <CartaoSessaoAgenda
                        key={s.id}
                        sessao={s}
                        numero={numerosSessao.get(s.id)}
                        nomeProfissional={perfilAtual?.nome || "Beatriz Coutinho"}
                        filtroPaciente={pacienteFiltro ?? ""}
                        filtroDia={diaFiltro ?? ""}
                      />
                    ))}
                    {(!sessoes || sessoes.length === 0) && (
                      <EstadoVazioAgenda
                        titulo="Nada marcado por aqui"
                        texto={
                          pacienteFiltro
                            ? "Esse paciente não tem sessão nesse dia."
                            : "Nenhum paciente tem sessão nesse dia."
                        }
                      />
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: "avisos",
              rotulo: "Avisos",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <form action={criarAviso} style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                    <input name="titulo" placeholder="Título do aviso" required style={campo} />
                    <textarea name="conteudo" placeholder="Mensagem" rows={2} required style={campo} />
                    <CampoValidade />
                    <button type="submit" style={botaoPrimario}>Publicar aviso</button>
                  </form>

                  <div className="grade-auto grade-auto--2">
                    {(avisos ?? []).map((a) => {
                      const expirado = a.validade && a.validade < hojeIso;
                      return (
                        <div key={a.id} style={{ ...avisoCartaoAdmin, opacity: expirado ? 0.55 : 1 }}>
                          <div>
                            <strong style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria-escura)" }}>
                              {a.titulo}
                            </strong>
                            <p style={{ margin: "4px 0 0", fontSize: 13.5 }}>{a.conteudo}</p>
                            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
                              {a.validade
                                ? `${expirado ? "expirou em" : "válido até"} ${new Date(`${a.validade}T00:00:00`).toLocaleDateString("pt-BR")}`
                                : "sem validade"}
                            </p>
                          </div>
                          <form action={removerAviso.bind(null, a.id)}>
                            <button type="submit" style={botaoTexto}>remover</button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              id: "destaques",
              rotulo: "Destaques",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: "0 0 14px" }}>
                    Cards com foto que aparecem em carrossel no topo do Início dos pacientes — divulgação,
                    novidades, cursos, o que você quiser mostrar.
                  </p>

                  <form action={criarDestaque} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                    <input name="titulo" placeholder="Título (ex: Curso Cuidados com o bebê)" required style={campo} />
                    <textarea name="subtitulo" placeholder="Texto menor, embaixo do título (opcional)" rows={2} style={campo} />
                    <UploadArquivo
                      nome="imagem_arquivo_url"
                      bucket="destaques"
                      rotulo="Foto — envie um arquivo:"
                      ajuda="Melhor resultado com imagem deitada (paisagem), até 50 MB."
                      extensoes={EXTENSOES_IMAGEM}
                    />
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                        ...ou cole o link de uma imagem:
                      </label>
                      <input name="imagem_url" placeholder="https://..." style={campo} />
                    </div>
                    <input name="link_url" placeholder="Link ao tocar no card (opcional)" style={campo} />
                    <button type="submit" style={botaoPrimario}>Publicar destaque</button>
                  </form>

                  <div style={{ display: "grid", gap: 10 }}>
                    {(destaques ?? []).map((d) =>
                      d.id === editandoDestaqueId ? (
                        <div key={d.id} style={{ ...cartao, display: "block" }}>
                          <form action={atualizarDestaque.bind(null, d.id)} style={{ display: "grid", gap: 10 }}>
                            <input name="titulo" defaultValue={d.titulo} required style={campo} />
                            <textarea name="subtitulo" defaultValue={d.subtitulo ?? ""} rows={2} style={campo} />
                            <UploadArquivo
                              nome="imagem_arquivo_url"
                              bucket="destaques"
                              rotulo="Trocar foto — envie um novo arquivo:"
                              ajuda="Deixe em branco pra manter a atual."
                              extensoes={EXTENSOES_IMAGEM}
                            />
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                ...ou cole um novo link (deixe em branco pra manter a atual):
                              </label>
                              <input name="imagem_url" placeholder="https://..." style={campo} />
                            </div>
                            <input name="link_url" defaultValue={d.link_url ?? ""} placeholder="Link ao tocar (opcional)" style={campo} />
                            <div style={{ display: "flex", gap: 10 }}>
                              <button type="submit" style={botaoPrimario}>Salvar alterações</button>
                              <Link href={hrefDestaques()} style={{ ...botaoTexto, alignSelf: "center" }}>
                                cancelar
                              </Link>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div key={d.id} style={cartao}>
                          <div style={{ display: "flex", gap: 12, flex: 1 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={d.imagem_url}
                              alt=""
                              width={56}
                              height={56}
                              style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                            />
                            <div>
                              <strong>{d.titulo}</strong>
                              {d.subtitulo && (
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                  {d.subtitulo}
                                </p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                            <Link href={hrefDestaques(d.id)} style={botaoTexto}>
                              editar
                            </Link>
                            <form action={removerDestaque.bind(null, d.id)}>
                              <button type="submit" style={botaoTexto}>remover</button>
                            </form>
                          </div>
                        </div>
                      )
                    )}
                    {(!destaques || destaques.length === 0) && (
                      <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                        Nenhum destaque publicado ainda.
                      </p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: "avaliacoes",
              rotulo: "Avaliações",
              conteudo: (
                <div style={{ padding: "24px 20px 0", display: "grid", gap: 32 }}>
                  <ResumoAvaliacoes titulo="Atendimento" perguntas={PERGUNTAS_ATENDIMENTO} itens={(avaliacoesAtendimento ?? []) as any} />
                  <ResumoAvaliacoes titulo="Aplicativo" perguntas={PERGUNTAS_APP} itens={(avaliacoesApp ?? []) as any} />
                </div>
              ),
            },
            {
              id: "indicacoes",
              rotulo: "Indicações",
              pendencias: indicacoesPendentes,
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: "0 0 14px" }}>
                    Indicações pro programa de fisioterapia pélvica domiciliar (50% na primeira sessão da indicada).
                    Marque como "usada" quando aplicar o desconto.
                  </p>

                  <div className="grade-auto grade-auto--2">
                    {(indicacoes ?? []).map((i: any) => (
                      <div key={i.id} style={{ ...cartao, alignItems: "flex-start" }}>
                        <div>
                          <strong>{i.nome_indicada}</strong>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                            {i.contato_indicada}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                            indicada por {i.perfis?.nome || i.perfis?.email} · {new Date(i.criado_em).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        {i.status === "usada" ? (
                          <span style={{ color: "#2f7a4f", fontWeight: 700, fontSize: 12.5 }}>usada</span>
                        ) : (
                          <form action={marcarIndicacaoUsada.bind(null, i.id)}>
                            <button type="submit" style={botaoTexto}>marcar como usada</button>
                          </form>
                        )}
                      </div>
                    ))}
                    {(!indicacoes || indicacoes.length === 0) && (
                      <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>Nenhuma indicação ainda.</p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: "blog",
              rotulo: "Blog",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                    O blog é a única parte do site que aparece <strong>sem login</strong> — é ele que
                    faz o Google encontrar a Beatriz. Rascunho não fica visível pra ninguém.
                  </p>

                  <details style={{ marginBottom: 24 }}>
                    <summary style={{ cursor: "pointer", listStyle: "none", marginBottom: 10 }}>
                      <span style={{ ...botaoPrimario, display: "inline-block" }}>+ Escrever post</span>
                    </summary>

                    <form action={criarPost} style={{ display: "grid", gap: 10, marginTop: 14 }}>
                      <input name="titulo" placeholder="Título do post" required style={campo} />
                      <textarea
                        name="resumo"
                        placeholder="Resumo — aparece na listagem e no link compartilhado (2 a 3 linhas)"
                        rows={2}
                        style={campo}
                      />
                      <textarea
                        name="conteudo"
                        placeholder="Texto do post. Deixe uma linha em branco entre os parágrafos."
                        rows={9}
                        style={campo}
                      />
                      <UploadArquivo
                        nome="capa_arquivo_url"
                        bucket="blog"
                        rotulo="Imagem de capa (opcional)"
                        ajuda="Melhor em formato deitado. É a imagem que aparece ao compartilhar o link."
                        extensoes={EXTENSOES_IMAGEM}
                      />
                      <input
                        name="link_externo"
                        placeholder="Link do artigo publicado (DOI, SciELO, PubMed) — opcional"
                        style={campo}
                      />
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                        <input type="checkbox" name="publicado" defaultChecked />
                        Publicar agora (desmarque pra salvar como rascunho)
                      </label>
                      <button type="submit" style={botaoPrimario}>Salvar post</button>
                    </form>
                  </details>

                  <div style={{ display: "grid", gap: 10 }}>
                    {(posts ?? []).map((post: any) =>
                      post.id === editandoPostId ? (
                        <div key={post.id} style={{ ...cartao, display: "block" }}>
                          <form action={atualizarPost.bind(null, post.id)} style={{ display: "grid", gap: 10 }}>
                            <input name="titulo" defaultValue={post.titulo} required style={campo} />
                            <textarea name="resumo" defaultValue={post.resumo ?? ""} rows={2} style={campo} />
                            <textarea name="conteudo" defaultValue={post.conteudo ?? ""} rows={9} style={campo} />
                            <UploadArquivo
                              nome="capa_arquivo_url"
                              bucket="blog"
                              rotulo="Imagem de capa"
                              ajuda="Escolha outro arquivo só se quiser trocar."
                              extensoes={EXTENSOES_IMAGEM}
                              urlAtual={post.capa_url}
                            />
                            <input
                              name="link_externo"
                              defaultValue={post.link_externo ?? ""}
                              placeholder="Link do artigo publicado — opcional"
                              style={campo}
                            />
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                              <input type="checkbox" name="publicado" defaultChecked={post.publicado} />
                              Publicado
                            </label>
                            <div style={{ display: "flex", gap: 10 }}>
                              <button type="submit" style={botaoPrimario}>Salvar</button>
                              <Link href={hrefBlog({ editarPost: undefined })} style={botaoTexto}>
                                cancelar
                              </Link>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div key={post.id} style={cartao}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <strong style={{ fontSize: 14 }}>{post.titulo}</strong>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: post.publicado ? "var(--cor-acento-suave)" : "var(--cor-borda)",
                                  color: post.publicado ? "var(--cor-acento)" : "var(--cor-texto-suave)",
                                }}
                              >
                                {post.publicado ? "PUBLICADO" : "RASCUNHO"}
                              </span>
                            </div>
                            {post.resumo && (
                              <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                                {post.resumo}
                              </p>
                            )}
                            <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
                              /blog/{post.slug}
                              {post.publicado && (
                                <>
                                  {" · "}
                                  <a
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "var(--cor-acento)", fontWeight: 600 }}
                                  >
                                    ver no site
                                  </a>
                                </>
                              )}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                            <Link href={hrefBlog({ editarPost: post.id })} style={botaoTexto}>
                              editar
                            </Link>
                            <form action={removerPost.bind(null, post.id)}>
                              <BotaoPerigo
                                mensagemConfirmacao={`Remover o post "${post.titulo}"? Isso não tem volta.`}
                                style={botaoTexto}
                              >
                                remover
                              </BotaoPerigo>
                            </form>
                          </div>
                        </div>
                      )
                    )}

                    {(!posts || posts.length === 0) && (
                      <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                        Nenhum post ainda. O blog só aparece no site depois do primeiro publicado.
                      </p>
                    )}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </main>

      <BottomNav papel="admin" />
    </>
  );
}

const campo: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  fontSize: 14,
  fontFamily: "var(--fonte-corpo)",
  width: "100%",
};

const campoNumeroPequeno: React.CSSProperties = {
  padding: "8px 6px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  fontSize: 13,
  fontFamily: "var(--fonte-corpo)",
  width: 56,
  textAlign: "center",
};

const botaoPrimario: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  justifySelf: "start",
};

const botaoSecundario: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const botaoPerigo: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #a2334a",
  background: "none",
  color: "#a2334a",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const botaoTexto: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-acento)",
  fontSize: 13,
  cursor: "pointer",
};

const botaoTextoPrimario: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-primaria)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const cartao: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
};

const avisoCartaoAdmin: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 16px",
  borderRadius: "0 12px 12px 0",
  borderLeft: "3px solid var(--cor-acento)",
  background: "var(--cor-acento-suave)",
};
