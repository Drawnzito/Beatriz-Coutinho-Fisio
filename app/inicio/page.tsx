import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
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
import { Paginacao } from "@/components/Paginacao";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { semanaAtual } from "@/lib/semana";
import { hojeIsoBrasil } from "@/lib/dataBrasil";
import { rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";
import { buscarNumerosSessao } from "@/lib/numeroSessao";

export const dynamic = "force-dynamic";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: { dia?: string; semana?: string; paginaProximas?: string; paginaAnteriores?: string };
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
    .select("nome, papel")
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

  let consultaSemana = supabase
    .from("sessoes")
    .select(
      "id, data, hora, status, motivo_recusa, tipo, observacoes, perfis!paciente_id(nome, email), planos(id, titulo, plano_exercicios(id, series, repeticoes, ordem, exercicios(*)))"
    )
    .gte("data", inicioSemana)
    .lte("data", fimSemana)
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
  if (!ehAdmin) consultaSemana = consultaSemana.eq("paciente_id", user.id);

  const TAMANHO_HISTORICO = 8;
  const paginaProximas = Math.max(1, parseInt(searchParams.paginaProximas ?? "1", 10) || 1);
  const paginaAnteriores = Math.max(1, parseInt(searchParams.paginaAnteriores ?? "1", 10) || 1);

  let consultaProximas = supabase
    .from("sessoes")
    .select("id, data, hora, status, motivo_recusa, tipo, perfis!paciente_id(nome, email), planos(titulo)", { count: "exact" })
    .gt("data", fimSemana)
    .order("data", { ascending: true })
    .range((paginaProximas - 1) * TAMANHO_HISTORICO, paginaProximas * TAMANHO_HISTORICO - 1);
  if (!ehAdmin) consultaProximas = consultaProximas.eq("paciente_id", user.id);

  let consultaAnteriores = supabase
    .from("sessoes")
    .select("id, data, hora, status, motivo_recusa, tipo, perfis!paciente_id(nome, email), planos(titulo)", { count: "exact" })
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
  ]);

  const nomeProfissional = ehAdmin ? perfil?.nome : (fisio as any)?.nome;

  const idsSessoesDoDia = [
    ...((sessoesSemana ?? []) as any[]).map((s) => s.id),
    ...((proximasSessoes ?? []) as any[]).map((s) => s.id),
    ...((anterioresSessoes ?? []) as any[]).map((s) => s.id),
  ];
  const numerosSessao = await buscarNumerosSessao(supabase, idsSessoesDoDia);

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
      {vendoComoPaciente && <AvisoModoTeste />}
      <Header
        titulo={`Olá, ${perfil?.nome?.split(" ")[0] || "por aqui"}`}
        subtitulo="Beatriz Coutinho Fisioterapia"
        avatarUrl={user.user_metadata?.avatar_url}
        variante="boasVindas"
      />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 100px" }}>
        {/* ---------- Destaques ---------- */}
        {destaques && destaques.length > 0 && (
          <>
            <h2 style={{ ...tituloSecao, marginBottom: 14 }}>Destaques</h2>
            <DestaquesCarrossel destaques={destaques} />
          </>
        )}

        {/* ---------- Mural de avisos ---------- */}
        <h2 style={tituloSecao}>Mural de avisos</h2>

        {(!avisos || avisos.length === 0) && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
            Nenhum aviso publicado no momento.
          </p>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {(avisos ?? []).map((a) => (
            <div key={a.id} style={avisoCartao}>
              <strong style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria-escura)", fontSize: 14.5 }}>
                {a.titulo}
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: 14 }}>{a.conteudo}</p>
            </div>
          ))}
        </div>

        {/* ---------- Sua semana ---------- */}
        <h2 style={{ ...tituloSecao, marginTop: 36 }}>{ehAdmin ? "Pacientes desta semana" : "Sua semana"}</h2>

        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--cor-texto-suave)" }}>
          {totalSemana === 0
            ? "Nenhuma sessão agendada essa semana."
            : ehAdmin
            ? `${totalSemana} ${totalSemana > 1 ? "sessões" : "sessão"} de pacientes essa semana.`
            : `Você tem ${totalSemana} ${totalSemana > 1 ? "sessões" : "sessão"} agendada${totalSemana > 1 ? "s" : ""} essa semana.`}
        </p>

        {!ehAdmin && (
          <div style={{ marginBottom: 18 }}>
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

          <div style={{ display: "grid", gap: 10 }}>
            {itensDoDia.map((item: any) => (
              <div key={item.id} style={sessaoCartao}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: corTipoSessao(item.tipo),
                      flexShrink: 0,
                    }}
                  />
                  <strong style={{ color: "var(--cor-primaria)", fontSize: 13 }}>
                    {ehAdmin && (item.perfis?.nome || item.perfis?.email) ? `${item.perfis.nome || item.perfis.email} · ` : ""}
                    {numerosSessao.has(item.id) ? `Sessão nº ${numerosSessao.get(item.id)} · ` : ""}
                    {rotuloTipoSessao(item.tipo)}
                    {nomeProfissional ? ` · ${nomeProfissional}` : ""}
                    {item.hora ? ` · ${item.hora.slice(0, 5)}` : ""}
                  </strong>
                </div>

                <div style={{ marginTop: 8 }}>
                  {ehAdmin ? (
                    <BadgeStatusSessao status={item.status} motivoRecusa={item.motivo_recusa} />
                  ) : (
                    <AcaoConfirmarSessao sessaoId={item.id} status={item.status} motivoRecusa={item.motivo_recusa} />
                  )}
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
                      {!ehAdmin && (item.planos.plano_exercicios ?? []).length > 0 && (
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
                            <div key={pe.id} style={exercicioMiniCartao}>
                              <strong style={{ fontSize: 13 }}>{ex.titulo}</strong>
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--cor-texto-suave)" }}>
                                {pe.series ?? ex.series_padrao ?? "-"} séries ×{" "}
                                {pe.repeticoes ?? ex.repeticoes_padrao ?? "-"} repetições
                              </p>
                              {ex.video_url && (
                                <div style={{ marginTop: 6 }}>
                                  <MidiaExercicio url={ex.video_url} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Local de atendimento ---------- */}
        <div style={{ margin: "28px 0" }}>
          <InfoContatoClinica whatsapp={configClinica?.whatsapp_contato} mostrarBotaoWhatsapp={!ehAdmin} />
        </div>

        {/* ---------- Outras sessões (fora da semana atual) ---------- */}
        {(() => {
          function cartaoOutraSessao(s: any) {
            const data = new Date(`${s.data}T00:00:00`);
            return (
              <div key={s.id} style={{ ...outraSessaoCartao, borderLeftColor: corTipoSessao(s.tipo) }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 13.5, textTransform: "capitalize" }}>
                    {data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}, {data.toLocaleDateString("pt-BR")}
                    {s.hora ? ` · ${s.hora.slice(0, 5)}` : ""}
                  </strong>
                  <BadgeStatusSessao status={s.status} motivoRecusa={s.motivo_recusa} curto />
                </div>
                <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                  {numerosSessao.has(s.id) ? `Sessão nº ${numerosSessao.get(s.id)} · ` : ""}
                  <strong style={{ color: "var(--cor-primaria)" }}>{rotuloTipoSessao(s.tipo)}</strong>
                  {nomeProfissional ? (
                    <>
                      {" · "}
                      <strong style={{ color: "var(--cor-primaria)" }}>{nomeProfissional}</strong>
                    </>
                  ) : null}
                  {ehAdmin && (s.perfis?.nome || s.perfis?.email) ? ` · ${s.perfis.nome || s.perfis.email}` : ""}
                  {s.planos?.titulo ? ` · ${s.planos.titulo}` : ""}
                </p>
              </div>
            );
          }

          return (
            <>
              {(proximasSessoes ?? []).length > 0 && (
                <>
                  <h2 style={{ ...tituloSecao, marginTop: 36 }}>Próximas sessões</h2>
                  <div style={{ display: "grid", gap: 8 }}>{(proximasSessoes ?? []).map(cartaoOutraSessao)}</div>
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
                  <div style={{ display: "grid", gap: 8 }}>{(anterioresSessoes ?? []).map(cartaoOutraSessao)}</div>
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

const outraSessaoCartao: React.CSSProperties = {
  background: "var(--cor-superficie)",
  border: "1px solid var(--cor-borda)",
  borderLeft: "3px solid var(--cor-primaria)",
  borderRadius: "0 10px 10px 0",
  padding: "10px 14px",
};

const exercicioMiniCartao: React.CSSProperties = {
  border: "1px solid var(--cor-borda)",
  borderRadius: 8,
  padding: "10px 12px",
  background: "var(--cor-fundo)",
};
