import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { Feedback } from "@/components/Feedback";
import { Abas } from "@/components/Abas";
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
  criarSessao,
  removerSessao,
  aprovarSolicitacaoSessao,
  recusarSolicitacaoSessao,
  criarConvitePaciente,
  removerConvitePaciente,
  criarDestaque,
  atualizarDestaque,
  removerDestaque,
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

  let listaSessoes = supabase
    .from("sessoes")
    .select(
      "id, data, hora, status, motivo_recusa, tipo, observacoes, paciente_id, perfis!paciente_id(nome, email), planos(titulo)"
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
    { data: exercicios },
    { data: pacientes },
    { data: pacientesArquivados },
    { data: avisos },
    { data: planos },
    { data: sessoes },
    { data: sessoesSemana },
    { data: convites },
    { data: destaques },
    { data: solicitacoes },
  ] = await Promise.all([
    supabase.from("exercicios").select("*").order("titulo", { ascending: true }),
    supabase.from("perfis").select("id, nome, email, idade").eq("papel", "paciente").is("arquivado_em", null).order("nome"),
    supabase
      .from("perfis")
      .select("id, nome, email, idade, arquivado_em")
      .eq("papel", "paciente")
      .not("arquivado_em", "is", null)
      .order("arquivado_em", { ascending: false }),
    supabase.from("avisos").select("*").order("criado_em", { ascending: false }),
    supabase
      .from("planos")
      .select("id, titulo, ativo, paciente_id, perfis!paciente_id(nome, email)")
      .order("criado_em", { ascending: false }),
    listaSessoes,
    contagemSemana,
    supabase.from("convites_paciente").select("*").order("criado_em", { ascending: false }),
    supabase.from("destaques").select("*").order("ordem", { ascending: true }),
    supabase
      .from("sessoes")
      .select("id, data, hora, tipo, observacoes, perfis!paciente_id(nome, email)")
      .eq("status", "solicitada")
      .order("data", { ascending: true }),
  ]);

  const opcoesAtribuicao = [
    ...(pacientes ?? []),
    { id: user.id, nome: `${perfilAtual?.nome || "Você"} (teste)`, email: perfilAtual?.email ?? "", idade: null },
  ];

  const verPacienteId = searchParams.verPaciente || undefined;
  const verArquivados = searchParams.arquivados === "1";
  const buscaPacienteFiltro = (searchParams.buscaPaciente || "").trim().toLowerCase();

  let pacienteDetalhe: any = null;
  let sessoesDetalhe: any[] = [];
  let planosDetalhe: any[] = [];
  let evolucoesDetalhe: any[] = [];
  if (verPacienteId) {
    const [{ data: pd }, { data: sd }, { data: pld }, { data: ed }] = await Promise.all([
      supabase.from("perfis").select("id, nome, email, idade, whatsapp, arquivado_em").eq("id", verPacienteId).maybeSingle(),
      supabase
        .from("sessoes")
        .select("id, data, hora, status, motivo_recusa, tipo, observacoes, planos(titulo)")
        .eq("paciente_id", verPacienteId)
        .order("data", { ascending: false }),
      supabase.from("planos").select("id, titulo, ativo, validade").eq("paciente_id", verPacienteId).order("criado_em", { ascending: false }),
      supabase.from("evolucoes").select("id, data, texto").eq("paciente_id", verPacienteId).order("data", { ascending: false }),
    ]);
    pacienteDetalhe = pd;
    sessoesDetalhe = sd ?? [];
    planosDetalhe = pld ?? [];
    evolucoesDetalhe = ed ?? [];
  }

  const listaPacientesBase = verArquivados ? pacientesArquivados ?? [] : pacientes ?? [];
  const listaPacientesFiltrada = buscaPacienteFiltro
    ? listaPacientesBase.filter(
        (p: any) =>
          (p.nome || "").toLowerCase().includes(buscaPacienteFiltro) ||
          (p.email || "").toLowerCase().includes(buscaPacienteFiltro)
      )
    : listaPacientesBase;

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

  const contagens: Record<string, number> = {};
  for (const s of sessoesSemana ?? []) {
    contagens[s.data] = (contagens[s.data] ?? 0) + 1;
  }

  const categoriaFiltro = searchParams.categoria || undefined;
  const buscaFiltro = searchParams.busca || undefined;
  const ordem = searchParams.ordem === "desc" ? "desc" : "asc";
  const categoriasDisponiveis = [...new Set((exercicios ?? []).map((e) => e.categoria))].sort();

  let exerciciosFiltrados = exercicios ?? [];
  if (categoriaFiltro) exerciciosFiltrados = exerciciosFiltrados.filter((e) => e.categoria === categoriaFiltro);
  if (buscaFiltro) {
    const alvo = buscaFiltro.toLowerCase();
    exerciciosFiltrados = exerciciosFiltrados.filter((e) => e.titulo.toLowerCase().includes(alvo));
  }
  if (ordem === "desc") exerciciosFiltrados = [...exerciciosFiltrados].reverse();

  const editandoId = searchParams.editar || undefined;
  const editandoDestaqueId = searchParams.editarDestaque || undefined;
  const hrefDestaques = (editar?: string) =>
    editar ? `/dashboard?aba=destaques&editarDestaque=${editar}` : "/dashboard?aba=destaques";

  function hrefBiblioteca(overrides: { categoria?: string; editar?: string; busca?: string; ordem?: string }) {
    const params = new URLSearchParams({ aba: "biblioteca" });
    const categoria = "categoria" in overrides ? overrides.categoria : categoriaFiltro;
    const editar = "editar" in overrides ? overrides.editar : editandoId;
    const busca = "busca" in overrides ? overrides.busca : buscaFiltro;
    const ordemAtual = "ordem" in overrides ? overrides.ordem : ordem;
    if (categoria) params.set("categoria", categoria);
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
      <Header
        titulo="Beatriz Coutinho"
        subtitulo="Painel da fisioterapeuta"
        avatarUrl={user.user_metadata?.avatar_url}
        variante="boasVindas"
      />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 0 100px" }}>
        <Abas
          inicial={searchParams.aba}
          abas={[
            {
              id: "biblioteca",
              rotulo: "Biblioteca",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  <form action={criarExercicio} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                    <input name="titulo" placeholder="Nome do exercício" required style={campo} />
                    <input name="categoria" placeholder="Categoria (ex: mobilidade, fortalecimento)" style={campo} />
                    <textarea name="descricao" placeholder="Descrição / como executar" rows={3} style={campo} />
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                        Vídeo/gif demonstrativo — envie um arquivo:
                      </label>
                      <input name="video_arquivo" type="file" accept="video/*,image/gif" style={campo} />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                        ...ou cole um link (Youtube, Instagram, Drive):
                      </label>
                      <input name="video_url" placeholder="https://..." style={campo} />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                        PDF passo a passo (opcional) — envie um arquivo:
                      </label>
                      <input name="pdf_arquivo" type="file" accept="application/pdf" style={campo} />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                        ...ou cole um link do PDF:
                      </label>
                      <input name="pdf_url" placeholder="https://..." style={campo} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input name="series_padrao" type="number" placeholder="Séries padrão" style={campo} />
                      <input name="repeticoes_padrao" type="number" placeholder="Repetições padrão" style={campo} />
                    </div>
                    <button type="submit" style={botaoPrimario}>Adicionar à biblioteca</button>
                  </form>

                  <form action="/dashboard" method="get" style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input type="hidden" name="aba" value="biblioteca" />
                    {categoriaFiltro && <input type="hidden" name="categoria" value={categoriaFiltro} />}
                    {ordem !== "asc" && <input type="hidden" name="ordem" value={ordem} />}
                    <input
                      name="busca"
                      defaultValue={buscaFiltro ?? ""}
                      placeholder="Buscar pelo nome do exercício…"
                      style={campo}
                    />
                    <button type="submit" style={botaoTextoPrimario}>buscar</button>
                    {buscaFiltro && (
                      <a href={hrefBiblioteca({ busca: "" })} style={botaoTexto}>
                        limpar
                      </a>
                    )}
                  </form>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
                    {categoriasDisponiveis.length > 1 && (
                      <div style={{ flex: 1 }}>
                        <SeletorOpcao
                          opcoes={categoriasDisponiveis.map((c) => ({ valor: c, rotulo: c }))}
                          selecionado={categoriaFiltro}
                          nomeParam="categoria"
                          baseHref="/dashboard"
                          manterParams={{ aba: "biblioteca", busca: buscaFiltro, ordem: ordem !== "asc" ? ordem : undefined }}
                          placeholder="Todas as categorias"
                        />
                      </div>
                    )}
                    <a href={hrefBiblioteca({ ordem: ordem === "asc" ? "desc" : "asc" })} style={botaoTexto}>
                      {ordem === "asc" ? "A → Z" : "Z → A"}
                    </a>
                  </div>

                  <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                    {exerciciosFiltrados.length} exercício{exerciciosFiltrados.length === 1 ? "" : "s"} · ordem alfabética
                  </p>

                  <div style={{ display: "grid", gap: 10 }}>
                    {exerciciosFiltrados.map((ex) =>
                      ex.id === editandoId ? (
                        <div key={ex.id} style={{ ...cartao, display: "block" }}>
                          <form action={atualizarExercicio.bind(null, ex.id)} style={{ display: "grid", gap: 10 }}>
                            <input name="titulo" defaultValue={ex.titulo} required style={campo} />
                            <input name="categoria" defaultValue={ex.categoria} style={campo} />
                            <textarea name="descricao" defaultValue={ex.descricao ?? ""} rows={3} style={campo} />
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                Trocar vídeo/gif — envie um novo arquivo:
                              </label>
                              <input name="video_arquivo" type="file" accept="video/*,image/gif" style={campo} />
                            </div>
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                ...ou cole um novo link (deixe em branco pra manter o atual):
                              </label>
                              <input name="video_url" placeholder="https://..." style={campo} />
                            </div>
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                Trocar PDF — envie um novo arquivo:
                              </label>
                              <input name="pdf_arquivo" type="file" accept="application/pdf" style={campo} />
                            </div>
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                ...ou cole um novo link do PDF (deixe em branco pra manter o atual):
                              </label>
                              <input name="pdf_url" placeholder="https://..." style={campo} />
                            </div>
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
                              <a href={hrefBiblioteca({ editar: "" })} style={{ ...botaoTexto, alignSelf: "center" }}>
                                cancelar
                              </a>
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
                            </p>
                            {ex.video_url && (
                              <div style={{ marginTop: 8, maxWidth: 220 }}>
                                <MidiaExercicio url={ex.video_url} />
                              </div>
                            )}
                          </div>
                          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                            <a href={hrefBiblioteca({ editar: ex.id })} style={botaoTexto}>
                              editar
                            </a>
                            <form action={removerExercicio.bind(null, ex.id)}>
                              <button type="submit" style={botaoTexto}>remover</button>
                            </form>
                          </div>
                        </div>
                      )
                    )}
                    {exerciciosFiltrados.length === 0 && (
                      <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                        Nenhum exercício {categoriaFiltro ? "nessa categoria" : "cadastrado ainda"}.
                      </p>
                    )}
                  </div>
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
                      <a href={hrefPacientes({ verPaciente: "" })} style={{ ...botaoTexto, display: "inline-block", marginBottom: 16 }}>
                        ← voltar à lista
                      </a>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
                        <div>
                          <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 20, color: "var(--cor-primaria)" }}>
                            {pacienteDetalhe.nome || pacienteDetalhe.email}
                          </strong>
                          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
                            {pacienteDetalhe.email}
                            {pacienteDetalhe.idade ? ` · ${pacienteDetalhe.idade} anos` : ""}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
                            {pacienteDetalhe.whatsapp ? (
                              <a
                                href={`https://wa.me/${pacienteDetalhe.whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#2f7a4f", fontWeight: 600, textDecoration: "none" }}
                              >
                                💬 {pacienteDetalhe.whatsapp}
                              </a>
                            ) : (
                              "Sem WhatsApp cadastrado"
                            )}
                          </p>
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
                        Histórico de sessões ({sessoesDetalhe.length})
                      </p>
                      <div style={{ display: "grid", gap: 8 }}>
                        {sessoesDetalhe.map((s) => (
                          <div key={s.id} style={{ ...cartao, borderLeft: `3px solid ${corTipoSessao(s.tipo)}`, borderRadius: "0 10px 10px 0" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <strong style={{ fontSize: 13 }}>
                                  {new Date(`${s.data}T00:00:00`).toLocaleDateString("pt-BR")}
                                  {s.hora ? ` às ${s.hora.slice(0, 5)}` : ""}
                                </strong>
                                <BadgeStatusSessao status={s.status} motivoRecusa={s.motivo_recusa} curto />
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                                {rotuloTipoSessao(s.tipo)}
                                {s.planos?.titulo ? ` · plano: ${s.planos.titulo}` : ""}
                              </p>
                              {s.observacoes && <p style={{ margin: "4px 0 0", fontSize: 13 }}>{s.observacoes}</p>}
                            </div>
                          </div>
                        ))}
                        {sessoesDetalhe.length === 0 && (
                          <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5 }}>Nenhuma sessão registrada ainda.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <form action={criarConvitePaciente} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
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
                          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
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
                          <a href={hrefPacientes({ buscaPaciente: "" })} style={botaoTexto}>limpar</a>
                        )}
                      </form>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: 0 }}>
                          {verArquivados ? `Pacientes arquivados (${listaPacientesFiltrada.length})` : `Pacientes ativos (${listaPacientesFiltrada.length})`}
                        </p>
                        <a href={hrefPacientes({ arquivados: verArquivados ? "" : "1" })} style={botaoTexto}>
                          {verArquivados ? "ver ativos" : "ver arquivados"}
                        </a>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        {listaPacientesFiltrada.map((p: any) => (
                          <a key={p.id} href={hrefPacientes({ verPaciente: p.id })} style={{ ...cartao, textDecoration: "none", color: "inherit" }}>
                            <div>
                              <strong>{p.nome || p.email}</strong>
                              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                {p.email}
                                {p.idade ? ` · ${p.idade} anos` : ""}
                              </p>
                            </div>
                            <span style={{ color: "var(--cor-acento)", fontSize: 13 }}>ver ficha →</span>
                          </a>
                        ))}
                        {listaPacientesFiltrada.length === 0 && (
                          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                            {verArquivados ? "Nenhum paciente arquivado." : "Nenhum paciente logou ainda."}
                          </p>
                        )}
                      </div>
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
                    <form action={criarPlano} style={{ display: "grid", gap: 10 }}>
                      <select name="paciente_id" required style={campo}>
                        <option value="">Selecione o paciente</option>
                        {opcoesAtribuicao.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome || p.email}
                          </option>
                        ))}
                      </select>
                      <input name="titulo" placeholder="Título do plano (ex: Treino A)" required style={campo} />

                      <div style={{ display: "grid", gap: 6 }}>
                        <p style={{ fontSize: 13, color: "var(--cor-texto-suave)", margin: 0 }}>
                          Selecione os exercícios deste plano:
                        </p>
                        {(exercicios ?? []).map((ex) => (
                          <label key={ex.id} style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "center" }}>
                            <input type="checkbox" name="exercicio_id" value={ex.id} />
                            {ex.titulo}
                          </label>
                        ))}
                      </div>

                      <button type="submit" style={botaoPrimario}>Criar plano</button>
                    </form>
                  )}

                  <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                    {(planos ?? []).map((pl: any) => (
                      <div key={pl.id} style={cartao}>
                        <div>
                          <strong>{pl.titulo}</strong>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                            {pl.perfis?.nome || pl.perfis?.email} {pl.ativo ? "· ativo" : "· inativo"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "agenda",
              rotulo: "Agenda",
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
                              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                {s.perfis?.nome || s.perfis?.email} · {rotuloTipoSessao(s.tipo)}
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

                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                    Agendar sessão
                  </p>

                  {opcoesAtribuicao.length === 0 ? (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                      Nenhum paciente logou ainda — peça pra ele entrar com Google uma vez no app.
                    </p>
                  ) : (
                    <form action={criarSessao} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
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

                      <textarea name="observacoes" placeholder="Observações (opcional)" rows={2} style={campo} />

                      <button type="submit" style={botaoPrimario}>Agendar sessão</button>
                    </form>
                  )}

                  <div style={{ display: "grid", gap: 10 }}>
                    {(sessoes ?? []).map((s: any) => (
                      <div key={s.id} style={cartao}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: corTipoSessao(s.tipo),
                                flexShrink: 0,
                              }}
                            />
                            <strong>
                              {new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR")}
                              {s.hora ? ` às ${s.hora.slice(0, 5)}` : ""}
                            </strong>
                            <BadgeStatusSessao status={s.status} motivoRecusa={s.motivo_recusa} curto />
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                            {s.perfis?.nome || s.perfis?.email} · {rotuloTipoSessao(s.tipo)}
                            {s.planos?.titulo ? ` · plano: ${s.planos.titulo}` : ""}
                          </p>
                          {s.observacoes && (
                            <p style={{ margin: "4px 0 0", fontSize: 13 }}>{s.observacoes}</p>
                          )}
                        </div>
                        <form action={removerSessao.bind(null, s.id)}>
                          <input type="hidden" name="_filtro_paciente" value={pacienteFiltro ?? ""} />
                          <input type="hidden" name="_filtro_dia" value={diaFiltro ?? ""} />
                          <button type="submit" style={botaoTexto}>remover</button>
                        </form>
                      </div>
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

                  <div style={{ display: "grid", gap: 10 }}>
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
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Foto — envie um arquivo:</label>
                      <input name="imagem_arquivo" type="file" accept="image/*" style={campo} />
                    </div>
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
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                Trocar foto — envie um novo arquivo:
                              </label>
                              <input name="imagem_arquivo" type="file" accept="image/*" style={campo} />
                            </div>
                            <div style={{ display: "grid", gap: 4 }}>
                              <label style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>
                                ...ou cole um novo link (deixe em branco pra manter a atual):
                              </label>
                              <input name="imagem_url" placeholder="https://..." style={campo} />
                            </div>
                            <input name="link_url" defaultValue={d.link_url ?? ""} placeholder="Link ao tocar (opcional)" style={campo} />
                            <div style={{ display: "flex", gap: 10 }}>
                              <button type="submit" style={botaoPrimario}>Salvar alterações</button>
                              <a href={hrefDestaques()} style={{ ...botaoTexto, alignSelf: "center" }}>
                                cancelar
                              </a>
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
                            <a href={hrefDestaques(d.id)} style={botaoTexto}>
                              editar
                            </a>
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
