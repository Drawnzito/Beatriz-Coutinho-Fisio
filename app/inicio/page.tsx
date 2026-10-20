import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MiniaturaExercicio } from "@/components/MiniaturaExercicio";
import { TiraSemana } from "@/components/TiraSemana";
import { NavegacaoSemana } from "@/components/NavegacaoSemana";
import { DiaEmDestaque } from "@/components/DiaEmDestaque";
import { EstadoVazioAgenda } from "@/components/EstadoVazioAgenda";
import { DestaquesCarrossel } from "@/components/DestaquesCarrossel";
import { AvisoModoTeste } from "@/components/AvisoModoTeste";
import { InfoContatoClinica } from "@/components/InfoContatoClinica";
import { SolicitarSessaoForm } from "@/components/SolicitarSessaoForm";
import { AcaoConfirmarSessao } from "@/components/AcaoConfirmarSessao";
import { BadgeStatusSessao } from "@/components/BadgeStatusSessao";
import { CartaoSessaoResumo } from "@/components/CartaoSessaoResumo";
import { Feedback } from "@/components/Feedback";
import { Paginacao } from "@/components/Paginacao";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { semanaAtual } from "@/lib/semana";
import { hojeIsoBrasil } from "@/lib/dataBrasil";
import { rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";
import { ChipEspecialidade } from "@/components/ChipEspecialidade";
import { rotuloEspecialidade } from "@/lib/especialidades";
import { buscarNumerosSessao } from "@/lib/numeroSessao";
import { AvaliarAtendimento } from "@/components/AvaliarAtendimento";
import { GuiaPrimeirosPassos } from "@/components/GuiaPrimeirosPassos";
import { Assistente } from "@/components/Assistente";
import { marcarGuiaVisto } from "@/app/perfil/actions";

export const dynamic = "force-dynamic";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: {
    dia?: string;
    semana?: string;
    paginaProximas?: string;
    paginaAnteriores?: string;
    conflito?: string;
    sucesso?: string;
  };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, guia_visto_em")
    .eq("id", user.id)
    .single();

  const vendoComoPaciente = perfil?.papel === "admin" && cookies().get("ver_como_paciente")?.value === "1";
  const ehAdmin = perfil?.papel === "admin" && !vendoComoPaciente;

  const semanaOffset = parseInt(searchParams.semana ?? "0", 10) || 0;
  const dias = semanaAtual(semanaOffset);
  const inicioSemana = dias[0].iso;
  const fimSemana = dias[6].iso;
  const hojeIso = hojeIsoBrasil();
  const diaSelecionado = dias.some((d) => d.iso === searchParams.dia)
    ? searchParams.dia!
    : semanaOffset === 0
    ? hojeIso
    : dias[0].iso;
  const diaInfo = dias.find((d) => d.iso === diaSelecionado)!;

  // A fisio ve so o nome do plano e a contagem: puxar os exercicios inteiros
  // (com midia) deixava o cartao enorme na agenda dela, e o detalhe ja esta na
  // ficha do paciente. A paciente continua vendo os exercicios do proprio dia.
  const camposPlano = ehAdmin
    ? "planos(id, titulo, plano_exercicios(id))"
    : "planos(id, titulo, plano_exercicios(id, series, repeticoes, ordem, exercicios(*)))";

  let consultaSemana = supabase
    .from("sessoes")
    .select(
      `id, data, hora, status, motivo_recusa, tipo, especialidade, modalidade, observacoes, paciente_id, perfis!paciente_id(nome, email), ${camposPlano}`
    )
    .gte("data", inicioSemana)
    .lte("data", fimSemana)
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
  if (!ehAdmin) consultaSemana = consultaSemana.eq("paciente_id", user.id);

  const TAMANHO_HISTORICO = 5;
  const paginaProximas = Math.max(1, parseInt(searchParams.paginaProximas ?? "1", 10) || 1);
  const paginaAnteriores = Math.max(1, parseInt(searchParams.paginaAnteriores ?? "1", 10) || 1);

  let consultaProximas = supabase
    .from("sessoes")
    .select("id, data, hora, status, motivo_recusa, tipo, especialidade, modalidade, perfis!paciente_id(nome, email), planos(titulo)", { count: "exact" })
    .gt("data", fimSemana)
    .order("data", { ascending: true })
    .range((paginaProximas - 1) * TAMANHO_HISTORICO, paginaProximas * TAMANHO_HISTORICO - 1);
  if (!ehAdmin) consultaProximas = consultaProximas.eq("paciente_id", user.id);

  let consultaAnteriores = supabase
    .from("sessoes")
    .select("id, data, hora, status, motivo_recusa, tipo, especialidade, modalidade, perfis!paciente_id(nome, email), planos(titulo)", { count: "exact" })
    .lt("data", inicioSemana)
    .order("data", { ascending: false })
    .range((paginaAnteriores - 1) * TAMANHO_HISTORICO, paginaAnteriores * TAMANHO_HISTORICO - 1);
  if (!ehAdmin) consultaAnteriores = consultaAnteriores.eq("paciente_id", user.id);

  const [
    { data: avisos },
    { data: sessoesSemana },
    { data: proximasSessoes, count: totalProximas },
    { data: anterioresSessoes, count: totalAnteriores },
    { data: destaques },
    { data: configClinica },
    { data: fisio },
    { data: avaliacoesFeitas },
  ] = await Promise.all([
    supabase
      .from("avisos")
      .select("*")
      .eq("ativo", true)
      .or(`validade.is.null,validade.gte.${hojeIso}`)
      .order("criado_em", { ascending: false }),
    consultaSemana,
    consultaProximas,
    consultaAnteriores,
    supabase.from("destaques").select("*").eq("ativo", true).order("ordem", { ascending: true }),
    supabase.from("configuracoes_clinica").select("whatsapp_contato").eq("id", "global").maybeSingle(),
    ehAdmin ? Promise.resolve({ data: null }) : supabase.from("perfis").select("nome").eq("papel", "admin").limit(1).maybeSingle(),
    ehAdmin
      ? Promise.resolve({ data: [] })
      : supabase.from("avaliacoes_atendimento").select("sessao_id").eq("paciente_id", user.id),
  ]);

  const nomeProfissional = ehAdmin ? perfil?.nome : (fisio as any)?.nome;

  const idsSessoesDoDia = [
    ...((sessoesSemana ?? []) as any[]).map((s) => s.id),
    ...((proximasSessoes ?? []) as any[]).map((s) => s.id),
    ...((anterioresSessoes ?? []) as any[]).map((s) => s.id),
  ];
  const numerosSessao = await buscarNumerosSessao(supabase, idsSessoesDoDia);
  const sessoesJaAvaliadas = new Set((avaliacoesFeitas ?? []).map((a: any) => a.sessao_id));

  const contagens: Record<string, number> = {};
  const porDia: Record<string, any[]> = {};
  for (const s of (sessoesSemana ?? []) as any[]) {
    contagens[s.data] = (contagens[s.data] ?? 0) + 1;
    (porDia[s.data] ??= []).push(s);
  }

  function hrefDia(iso: string, overrides: { semana?: number } = {}) {
    const semana = overrides.semana ?? semanaOffset;
    const params = new URLSearchParams({ dia: iso });
    if (semana) params.set("semana", String(semana));
    return `/inicio?${params.toString()}`;
  }

  function hrefSemana(semana: number) {
    return semana ? `/inicio?semana=${semana}` : "/inicio";
  }

  function hrefHistorico(overrides: { paginaProximas?: number; paginaAnteriores?: number }) {
    const params = new URLSearchParams();
    if (searchParams.dia) params.set("dia", searchParams.dia);
    if (semanaOffset) params.set("semana", String(semanaOffset));
    const pProximas = overrides.paginaProximas ?? paginaProximas;
    const pAnteriores = overrides.paginaAnteriores ?? paginaAnteriores;
    if (pProximas > 1) params.set("paginaProximas", String(pProximas));
    if (pAnteriores > 1) params.set("paginaAnteriores", String(pAnteriores));
    return `/inicio?${params.toString()}`;
  }

  const hrefsSemana = Object.fromEntries(dias.map((d) => [d.iso, hrefDia(d.iso)]));

  const totalSemana = sessoesSemana?.length ?? 0;
  const itensDoDia = porDia[diaSelecionado] ?? [];

  return (
    <>
      {/* Mesma tarja do painel: confirmar presença e pedir sessão não trocavam
          de tela, e a paciente não tinha como saber se tinha dado certo. */}
      <Feedback mensagem={searchParams.sucesso} />
      {vendoComoPaciente && <AvisoModoTeste />}
      <Header
        titulo={`Olá, ${perfil?.nome?.split(" ")[0] || "por aqui"}`}
        subtitulo="Beatriz Coutinho Fisioterapia"
        avatarUrl={user.user_metadata?.avatar_url}
        variante="boasVindas"
      />

      <main className="conteudo">
        {!ehAdmin && !perfil?.guia_visto_em && <GuiaPrimeirosPassos onFechar={marcarGuiaVisto} />}

        {/* ---------- Destaques ----------
            A indicação entra como slide fixo, então o carrossel aparece
            mesmo sem nenhum destaque cadastrado. */}
        <h2 style={{ ...tituloSecao, marginBottom: 14 }}>Destaques</h2>
        <DestaquesCarrossel destaques={destaques ?? []} mostrarIndicacao />

        {/* ---------- Mural de avisos ----------
            Seção inteira some quando não há aviso: título seguido de
            "nenhum aviso" só ocupava espaço sem informar nada. */}
        {avisos && avisos.length > 0 && (
          <>
            <h2 style={tituloSecao}>Mural de avisos</h2>
            <div className="grade-auto grade-auto--2">
              {avisos.map((a) => (
                <div key={a.id} style={avisoCartao}>
                  <strong style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria-escura)", fontSize: 14.5 }}>
                    {a.titulo}
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: 14 }}>{a.conteudo}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- Sua semana ---------- */}
        <div data-tour="agenda">
        <h2 style={{ ...tituloSecao, marginTop: 36 }}>{ehAdmin ? "Pacientes desta semana" : "Sua semana"}</h2>

        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
          {totalSemana === 0
            ? "Nenhuma sessão agendada essa semana."
            : ehAdmin
            ? `${totalSemana} ${totalSemana > 1 ? "sessões" : "sessão"} de pacientes essa semana.`
            : `Você tem ${totalSemana} ${totalSemana > 1 ? "sessões" : "sessão"} agendada${totalSemana > 1 ? "s" : ""} essa semana.`}
        </p>

        {!ehAdmin && (
          <div data-tour="solicitar" style={{ marginBottom: 18 }}>
            {searchParams.conflito && (
              <p
                style={{
                  margin: "0 0 10px",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#f4dde1",
                  color: "#a2334a",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {searchParams.conflito} — escolha outro horário.
              </p>
            )}
            <SolicitarSessaoForm />
          </div>
        )}

        <NavegacaoSemana
          inicioIso={dias[0].iso}
          fimIso={dias[6].iso}
          hrefAnterior={hrefSemana(semanaOffset - 1)}
          hrefProxima={hrefSemana(semanaOffset + 1)}
          hrefHoje={hrefSemana(0)}
          emSemanaAtual={semanaOffset === 0}
        />

        <DiaEmDestaque
          numero={diaInfo.numero}
          rotulo={`${diaInfo.nomeCompleto}${diaInfo.hoje ? " · Hoje" : ""}`}
          contagem={itensDoDia.length}
        />

        <TiraSemana dias={dias} hrefs={hrefsSemana} selecionado={diaSelecionado} contagens={contagens} />

        <div style={{ marginTop: 16 }}>
          {itensDoDia.length === 0 && (
            <EstadoVazioAgenda
              titulo="Nada marcado por aqui"
              texto={
                ehAdmin
                  ? "Nenhum paciente tem sessão nesse dia."
                  : "Dia livre — aproveite pra descansar ou adiantar seus exercícios."
              }
            />
          )}

          {/* Na visão da fisio os cartões viram fichas compactas em duas
              colunas: a leitura ali é "quem vem e a que horas", o detalhe
              está na ficha do paciente. A paciente tem uma sessão por dia e
              precisa do plano junto, então segue em cartão inteiro. */}
          <div className={ehAdmin ? "grade-compacta" : "grade-auto"}>
            {itensDoDia.map((item: any) =>
              ehAdmin ? (
                <Link
                  key={item.id}
                  href={`/dashboard?aba=pacientes&verPaciente=${item.paciente_id}`}
                  style={{
                    ...sessaoCartao,
                    padding: "10px 11px",
                    borderTop: `3px solid ${corTipoSessao(item.tipo)}`,
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--cor-primaria)",
                      lineHeight: 1.1,
                    }}
                  >
                    {item.hora ? item.hora.slice(0, 5) : "sem hora"}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: 3,
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.perfis?.nome || item.perfis?.email || "—"}
                  </span>

                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 10.5,
                      color: "var(--cor-texto-suave)",
                    }}
                  >
                    {rotuloEspecialidade(item.especialidade) || rotuloTipoSessao(item.tipo)}
                  </span>

                  <div style={{ marginTop: 6 }}>
                    <BadgeStatusSessao status={item.status} motivoRecusa={item.motivo_recusa} curto />
                  </div>
                </Link>
              ) : (
              /* Hora em primeiro plano e situação no canto: a paciente abre o
                 app pra saber que horas é e se está de pé. O que antes era uma
                 linha só, em negrito, com tipo + nome da fisio + hora, virou
                 uma hierarquia — e o nome da fisioterapeuta saiu, porque é
                 sempre a mesma pessoa em todas as sessões. */
              /* Canto reto do lado da borda grossa: com os 10px de raio nos
                 quatro cantos, a passagem de 3px pra 1px vira uma curva torta
                 na quina. Mesmo tratamento dos cartões de histórico. */
              <div
                key={item.id}
                style={{
                  ...sessaoCartao,
                  borderLeft: `3px solid ${corTipoSessao(item.tipo)}`,
                  borderRadius: "0 10px 10px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "4px 10px",
                    // Em cartão estreito o selo desce em vez de brigar com a hora.
                    flexWrap: "wrap",
                  }}
                >
                  <strong
                    style={{
                      fontFamily: "var(--fonte-titulo)",
                      fontSize: 22,
                      lineHeight: 1,
                      color: "var(--cor-primaria)",
                    }}
                  >
                    {item.hora ? item.hora.slice(0, 5) : "a combinar"}
                  </strong>
                  <BadgeStatusSessao status={item.status} motivoRecusa={item.motivo_recusa} curto />
                </div>

                <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                  {rotuloTipoSessao(item.tipo)}
                  {numerosSessao.has(item.id) ? ` · sessão nº ${numerosSessao.get(item.id)}` : ""}
                </p>

                {/* Especialidade vem antes do plano: e o dado que define o atendimento */}
                {item.especialidade && (
                  <div style={{ marginTop: 8 }}>
                    <ChipEspecialidade especialidade={item.especialidade} modalidade={item.modalidade} />
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <AcaoConfirmarSessao
                    sessaoId={item.id}
                    status={item.status}
                    motivoRecusa={item.motivo_recusa}
                    mostrarBadge={false}
                  />
                </div>

                {item.observacoes && (
                  <p style={{ margin: "6px 0 0", fontSize: 14 }}>{item.observacoes}</p>
                )}

                {item.planos && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                        Plano: {item.planos.titulo}
                      </p>
                      {(item.planos.plano_exercicios ?? []).length > 0 && (
                        <Link
                          href={`/treino/${item.planos.id}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#fff",
                            background: "var(--cor-primaria)",
                            padding: "5px 10px",
                            borderRadius: 999,
                            textDecoration: "none",
                          }}
                        >
                          ▶ Iniciar
                        </Link>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {(item.planos.plano_exercicios ?? [])
                        .sort((a: any, b: any) => a.ordem - b.ordem)
                        .map((pe: any) => {
                          const ex = pe.exercicios;
                          return (
                            <div key={pe.id} style={{ ...exercicioMiniCartao, display: "flex", gap: 11 }}>
                              <div style={{ flexShrink: 0 }}>
                                <MiniaturaExercicio
                                  videoUrl={ex.video_url}
                                  pdfUrl={ex.pdf_url}
                                  titulo={ex.titulo}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ fontSize: 13.5 }}>{ex.titulo}</strong>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--cor-texto-suave)" }}>
                                  {pe.series ?? ex.series_padrao ?? "-"} ×{" "}
                                  {pe.repeticoes ?? ex.repeticoes_padrao ?? "-"} repetições
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              )
            )}
          </div>
        </div>
        </div>

        {/* ---------- Local de atendimento ---------- */}
        <div style={{ margin: "28px 0" }}>
          <InfoContatoClinica whatsapp={configClinica?.whatsapp_contato} mostrarBotaoWhatsapp={!ehAdmin} />
        </div>

        {/* ---------- Outras sessões (fora da semana atual) ---------- */}
        {(() => {
          // Cartão de resumo: data, hora, quem/o quê e o status. É uma lista
          // de consulta rápida — nome do plano e profissional saíram porque
          // repetiam em todas as linhas sem ajudar a distinguir uma da outra.
          function cartaoOutraSessao(s: any, compacto?: boolean) {
            const podeAvaliar =
              !ehAdmin &&
              s.status === "confirmada" &&
              s.data <= hojeIso &&
              !sessoesJaAvaliadas.has(s.id);

            return (
              <CartaoSessaoResumo
                key={s.id}
                sessao={s}
                nomePaciente={ehAdmin ? s.perfis?.nome || s.perfis?.email || "—" : undefined}
                compacto={compacto}
              >
                {podeAvaliar && <AvaliarAtendimento sessaoId={s.id} />}
              </CartaoSessaoResumo>
            );
          }

          return (
            <>
              {(proximasSessoes ?? []).length > 0 && (
                <>
                  <h2 style={{ ...tituloSecao, marginTop: 36 }}>Próximas sessões</h2>
                  <div className="grade-compacta">{(proximasSessoes ?? []).map((s) => cartaoOutraSessao(s))}</div>
                  <Paginacao
                    pagina={paginaProximas}
                    total={totalProximas ?? 0}
                    tamanhoPagina={TAMANHO_HISTORICO}
                    hrefPagina={(p) => hrefHistorico({ paginaProximas: p })}
                  />
                </>
              )}
              {(anterioresSessoes ?? []).length > 0 && (
                <>
                  <h2 style={{ ...tituloSecao, marginTop: 28 }}>Sessões anteriores</h2>
                  <div className="grade-compacta">
                    {(anterioresSessoes ?? []).map((s) => cartaoOutraSessao(s, true))}
                  </div>
                  <Paginacao
                    pagina={paginaAnteriores}
                    total={totalAnteriores ?? 0}
                    tamanhoPagina={TAMANHO_HISTORICO}
                    hrefPagina={(p) => hrefHistorico({ paginaAnteriores: p })}
                  />
                </>
              )}
            </>
          );
        })()}
      </main>

      {/* Assistente: sempre à vista, mas dispensável no X. Aparece também pra
          Beatriz — ela precisa conseguir abrir e conferir o que a Bia anda
          respondendo pras pacientes. O antigo atalho "Primeiros passos" virou
          uma das perguntas dela. */}
      <Assistente whatsapp={configClinica?.whatsapp_contato} />

      <BottomNav papel={ehAdmin ? "admin" : "paciente"} />
    </>
  );
}

const tituloSecao: React.CSSProperties = {
  fontFamily: "var(--fonte-titulo)",
  color: "var(--cor-primaria)",
  fontSize: 18,
  marginBottom: 14,
};

const avisoCartao: React.CSSProperties = {
  background: "var(--cor-acento-suave)",
  borderRadius: "0 12px 12px 0",
  borderLeft: "3px solid var(--cor-acento)",
  padding: "12px 16px",
};

const sessaoCartao: React.CSSProperties = {
  background: "var(--cor-superficie)",
  border: "1px solid var(--cor-borda)",
  borderRadius: 10,
  padding: "12px 14px",
};

const exercicioMiniCartao: React.CSSProperties = {
  border: "1px solid var(--cor-borda)",
  borderRadius: 8,
  padding: "10px 12px",
  background: "var(--cor-fundo)",
};
