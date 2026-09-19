import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { Feedback } from "@/components/Feedback";
import { Abas } from "@/components/Abas";
import { SeletorPaciente } from "@/components/SeletorPaciente";
import { SeletorOpcao } from "@/components/SeletorOpcao";
import { TiraSemana } from "@/components/TiraSemana";
import { CampoValidade } from "@/components/CampoValidade";
import { redirect } from "next/navigation";
import { semanaAtual } from "@/lib/semana";
import { TIPOS_SESSAO, rotuloTipoSessao, corTipoSessao } from "@/lib/tiposSessao";
import {
  criarExercicio,
  removerExercicio,
  criarAviso,
  removerAviso,
  criarPlano,
  criarSessao,
  removerSessao,
  criarConvitePaciente,
  removerConvitePaciente,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; aba?: string; paciente?: string; dia?: string; categoria?: string };
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
    .select("papel")
    .eq("id", user.id)
    .single();

  if (perfilAtual?.papel !== "admin") {
    redirect("/inicio");
  }

  const pacienteFiltro = searchParams.paciente || undefined;
  const diaFiltro = searchParams.dia || undefined;
  const dias = semanaAtual();

  let listaSessoes = supabase
    .from("sessoes")
    .select("id, data, hora, status, tipo, observacoes, paciente_id, perfis(nome, email), planos(titulo)")
    .order("data", { ascending: true })
    .order("hora", { ascending: true });
  if (pacienteFiltro) listaSessoes = listaSessoes.eq("paciente_id", pacienteFiltro);
  if (diaFiltro) listaSessoes = listaSessoes.eq("data", diaFiltro);

  let contagemSemana = supabase
    .from("sessoes")
    .select("data")
    .gte("data", dias[0].iso)
    .lte("data", dias[6].iso);
  if (pacienteFiltro) contagemSemana = contagemSemana.eq("paciente_id", pacienteFiltro);

  const [
    { data: exercicios },
    { data: pacientes },
    { data: avisos },
    { data: planos },
    { data: sessoes },
    { data: sessoesSemana },
    { data: convites },
  ] = await Promise.all([
    supabase.from("exercicios").select("*").order("titulo", { ascending: true }),
    supabase.from("perfis").select("id, nome, email, idade").eq("papel", "paciente").order("nome"),
    supabase.from("avisos").select("*").order("criado_em", { ascending: false }),
    supabase
      .from("planos")
      .select("id, titulo, ativo, paciente_id, perfis(nome, email)")
      .order("criado_em", { ascending: false }),
    listaSessoes,
    contagemSemana,
    supabase.from("convites_paciente").select("*").order("criado_em", { ascending: false }),
  ]);

  const contagens: Record<string, number> = {};
  for (const s of sessoesSemana ?? []) {
    contagens[s.data] = (contagens[s.data] ?? 0) + 1;
  }

  const categoriaFiltro = searchParams.categoria || undefined;
  const categoriasDisponiveis = [...new Set((exercicios ?? []).map((e) => e.categoria))].sort();
  const exerciciosFiltrados = categoriaFiltro
    ? (exercicios ?? []).filter((e) => e.categoria === categoriaFiltro)
    : exercicios ?? [];

  const hojeIso = new Date().toISOString().slice(0, 10);

  function hrefAgenda(overrides: { paciente?: string; dia?: string }) {
    const params = new URLSearchParams({ aba: "agenda" });
    const paciente = "paciente" in overrides ? overrides.paciente : pacienteFiltro;
    const dia = "dia" in overrides ? overrides.dia : diaFiltro;
    if (paciente) params.set("paciente", paciente);
    if (dia) params.set("dia", dia);
    return `/dashboard?${params.toString()}`;
  }

  const hrefsSemana = Object.fromEntries(
    dias.map((d) => [d.iso, hrefAgenda({ dia: diaFiltro === d.iso ? "" : d.iso })])
  );

  return (
    <>
      <Feedback mensagem={searchParams.sucesso} />
      <Header
        titulo="Beatriz Coutinho"
        subtitulo="Painel da fisioterapeuta"
        avatarUrl={user.user_metadata?.avatar_url}
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
                    <div style={{ display: "flex", gap: 10 }}>
                      <input name="series_padrao" type="number" placeholder="Séries padrão" style={campo} />
                      <input name="repeticoes_padrao" type="number" placeholder="Repetições padrão" style={campo} />
                    </div>
                    <button type="submit" style={botaoPrimario}>Adicionar à biblioteca</button>
                  </form>

                  {categoriasDisponiveis.length > 1 && (
                    <div style={{ marginBottom: 14 }}>
                      <SeletorOpcao
                        opcoes={categoriasDisponiveis.map((c) => ({ valor: c, rotulo: c }))}
                        selecionado={categoriaFiltro}
                        nomeParam="categoria"
                        baseHref="/dashboard"
                        manterParams={{ aba: "biblioteca" }}
                        placeholder="Todas as categorias"
                      />
                    </div>
                  )}

                  <p style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                    {exerciciosFiltrados.length} exercício{exerciciosFiltrados.length === 1 ? "" : "s"} · ordem alfabética
                  </p>

                  <div style={{ display: "grid", gap: 10 }}>
                    {exerciciosFiltrados.map((ex) => (
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
                        <form action={removerExercicio.bind(null, ex.id)}>
                          <button type="submit" style={botaoTexto}>remover</button>
                        </form>
                      </div>
                    ))}
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
                  <form action={criarConvitePaciente} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                    <input name="nome" placeholder="Nome do paciente" required style={campo} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <input name="idade" type="number" placeholder="Idade (opcional)" style={campo} />
                      <input name="email" type="email" placeholder="E-mail do Google" required style={campo} />
                    </div>
                    <button type="submit" style={botaoPrimario}>Pré-cadastrar paciente</button>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
                      Ele entra pra lista assim que fizer login com esse mesmo e-mail no Google — não precisa
                      convite por link nem senha.
                    </p>
                  </form>

                  {(convites ?? []).length > 0 && (
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

                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                    Pacientes ativos
                  </p>
                  <div style={{ display: "grid", gap: 10 }}>
                    {(pacientes ?? []).map((p) => (
                      <div key={p.id} style={cartao}>
                        <div>
                          <strong>{p.nome || p.email}</strong>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                            {p.email}
                            {p.idade ? ` · ${p.idade} anos` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!pacientes || pacientes.length === 0) && (
                      <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                        Nenhum paciente logou ainda.
                      </p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: "plano",
              rotulo: "Montar plano",
              conteudo: (
                <div style={{ padding: "24px 20px 0" }}>
                  {(pacientes ?? []).length === 0 ? (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                      Nenhum paciente logou ainda — peça pra ele entrar com Google uma vez no app.
                    </p>
                  ) : (
                    <form action={criarPlano} style={{ display: "grid", gap: 10 }}>
                      <select name="paciente_id" required style={campo}>
                        <option value="">Selecione o paciente</option>
                        {(pacientes ?? []).map((p) => (
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
                      pacientes={pacientes ?? []}
                      selecionado={pacienteFiltro}
                      baseHref="/dashboard"
                      manterParams={{ aba: "agenda", dia: diaFiltro }}
                      placeholder="Todos os pacientes"
                    />

                    <TiraSemana dias={dias} hrefs={hrefsSemana} selecionado={diaFiltro} contagens={contagens} />

                    {diaFiltro && (
                      <a
                        href={hrefAgenda({ dia: "" })}
                        style={{ fontSize: 12.5, color: "var(--cor-acento)", justifySelf: "start" }}
                      >
                        limpar filtro de dia
                      </a>
                    )}
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--cor-texto-suave)", margin: "0 0 10px" }}>
                    Agendar sessão
                  </p>

                  {(pacientes ?? []).length === 0 ? (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                      Nenhum paciente logou ainda — peça pra ele entrar com Google uma vez no app.
                    </p>
                  ) : (
                    <form action={criarSessao} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                      <input type="hidden" name="_filtro_paciente" value={pacienteFiltro ?? ""} />
                      <input type="hidden" name="_filtro_dia" value={diaFiltro ?? ""} />

                      <select name="paciente_id" required defaultValue={pacienteFiltro ?? ""} style={campo}>
                        <option value="">Selecione o paciente</option>
                        {(pacientes ?? []).map((p) => (
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
                      <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                        Nenhuma sessão encontrada com esse filtro.
                      </p>
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

const botaoTexto: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-acento)",
  fontSize: 13,
  cursor: "pointer",
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
