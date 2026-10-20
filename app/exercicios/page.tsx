import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Assistente } from "@/components/Assistente";
import { CartaoTreino } from "@/components/CartaoTreino";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { MiniaturaExercicio } from "@/components/MiniaturaExercicio";
import { AtalhoPassoAPasso } from "@/components/PassoAPasso";
import { Feedback } from "@/components/Feedback";
import { MantemPosicao } from "@/components/MantemPosicao";
import { SeletorPaciente } from "@/components/SeletorPaciente";
import { AvisoModoTeste } from "@/components/AvisoModoTeste";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { atualizarItemPlano, removerItemPlano, adicionarExercicioAoPlano } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage({
  searchParams,
}: {
  searchParams: { paciente?: string; sucesso?: string; treino?: string };
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
    .select("papel")
    .eq("id", user.id)
    .single();

  const vendoComoPaciente = perfil?.papel === "admin" && cookies().get("ver_como_paciente")?.value === "1";
  const ehAdmin = perfil?.papel === "admin" && !vendoComoPaciente;

  if (ehAdmin) {
    return (
      <VisaoAdmin
        pacienteSelecionado={searchParams.paciente}
        sucesso={searchParams.sucesso}
      />
    );
  }

  const { data: todosOsPlanos } = await supabase
    .from("planos")
    .select(
      "id, titulo, ativo, plano_exercicios(id, series, repeticoes, ordem, exercicios(id, titulo, descricao, video_url, pdf_url, series_padrao, repeticoes_padrao))"
    )
    .eq("paciente_id", user.id)
    .order("criado_em", { ascending: false });

  const planos = (todosOsPlanos ?? []).filter((p) => p.ativo);
  const planosAnteriores = (todosOsPlanos ?? []).filter((p) => !p.ativo);

  // Só pra assistente saber se mostra o botão de WhatsApp.
  const { data: configClinica } = await supabase
    .from("configuracoes_clinica")
    .select("whatsapp_contato")
    .eq("id", "global")
    .maybeSingle();

  // Sem treino na URL, a tela mostra os treinos como cartões; com treino, só
  // ele, por inteiro. Antes a página abria direto na lista completa do
  // primeiro treino, o que dava uma coluna longa de linhas iguais e escondia
  // os outros treinos atrás de pílulas de seleção.
  const todosOsTreinos = [...planos, ...planosAnteriores];
  const planoSelecionado = searchParams.treino
    ? todosOsTreinos.find((p) => p.id === searchParams.treino) ?? null
    : null;

  return (
    <>
      {vendoComoPaciente && <AvisoModoTeste />}
      <Header titulo="Seus exercícios" subtitulo="Beatriz Coutinho Fisioterapia" variante="boasVindas" />

      <main className="conteudo">
        {planos.length === 0 && planosAnteriores.length === 0 && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
            Nenhum plano atribuído ainda. Assim que a Beatriz montar o seu, ele aparece aqui.
          </p>
        )}

        {/* ---------- Os treinos, como cartões ---------- */}
        {!planoSelecionado && planos.length > 0 && (
          <div className="grade-auto grade-auto--2" style={{ marginBottom: 8 }}>
            {planos.map((plano: any) => (
              <CartaoTreino
                key={plano.id}
                titulo={plano.titulo}
                href={`/exercicios?treino=${plano.id}`}
                hrefIniciar={`/treino/${plano.id}`}
                itens={[...(plano.plano_exercicios ?? [])]
                  .sort((a: any, b: any) => a.ordem - b.ordem)
                  .map((item: any) => ({
                    id: item.id,
                    titulo: item.exercicios.titulo,
                    video_url: item.exercicios.video_url,
                    pdf_url: item.exercicios.pdf_url,
                  }))}
              />
            ))}
          </div>
        )}

        {/* ---------- Um treino aberto ---------- */}
        {planoSelecionado && (
          <section style={{ marginBottom: 14 }}>
            <Link
              href="/exercicios"
              style={{
                display: "inline-block",
                marginBottom: 14,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cor-primaria)",
                textDecoration: "none",
              }}
            >
              ← todos os treinos
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ fontSize: 18, color: "var(--cor-primaria)", margin: 0, fontFamily: "var(--fonte-titulo)" }}>
                {planoSelecionado.titulo}
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "var(--cor-texto-suave)" }}>
                  {(planoSelecionado.plano_exercicios ?? []).length} exercício
                  {(planoSelecionado.plano_exercicios ?? []).length === 1 ? "" : "s"}
                  {!planoSelecionado.ativo ? " · encerrado" : ""}
                </span>
              </h3>
              {planoSelecionado.ativo && (planoSelecionado.plano_exercicios ?? []).length > 0 && (
                <Link
                  href={`/treino/${planoSelecionado.id}`}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#fff",
                    background: "var(--cor-primaria)",
                    padding: "8px 14px",
                    borderRadius: 999,
                    textDecoration: "none",
                  }}
                >
                  ▶ Iniciar treino
                </Link>
              )}
            </div>

            <div className="grade-auto grade-auto--2">
              {(planoSelecionado.plano_exercicios ?? [])
                .sort((a: any, b: any) => a.ordem - b.ordem)
                .map((item: any) => {
                  const ex = item.exercicios;
                  return (
                    <div key={item.id} style={{ ...exercicioCartao, display: "flex", gap: 12 }}>
                      <div style={{ flexShrink: 0 }}>
                        <MiniaturaExercicio
                          videoUrl={ex.video_url}
                          pdfUrl={ex.pdf_url}
                          titulo={ex.titulo}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 14.5 }}>{ex.titulo}</strong>
                        <p
                          style={{
                            display: "inline-block",
                            margin: "5px 0 0",
                            padding: "2px 9px",
                            borderRadius: 999,
                            background: "var(--cor-fundo)",
                            border: "1px solid var(--cor-borda)",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--cor-primaria)",
                          }}
                        >
                          {item.series ?? ex.series_padrao ?? "-"} ×{" "}
                          {item.repeticoes ?? ex.repeticoes_padrao ?? "-"} repetições
                        </p>
                        {ex.descricao && (
                          <p style={{ margin: "7px 0 0", fontSize: 13, color: "var(--cor-texto-suave)", lineHeight: 1.35 }}>
                            {ex.descricao}
                          </p>
                        )}
                        {/* Com vídeo, o atalho já aparece embaixo da miniatura */}
                        {!ex.video_url && ex.pdf_url && <AtalhoPassoAPasso url={ex.pdf_url} />}
                      </div>
                    </div>
                  );
                })}
              {(planoSelecionado.plano_exercicios ?? []).length === 0 && (
                <p style={{ color: "var(--cor-texto-suave)", fontSize: 13.5 }}>
                  Esse treino ainda não tem exercícios.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Treinos encerrados: mesmos cartões, apagados e recolhidos. Antes
            eram <details> dentro de <details>, dois cliques pra ver uma lista
            que ninguém procura com frequência. */}
        {!planoSelecionado && planosAnteriores.length > 0 && (
          <details style={{ marginTop: 24 }}>
            <summary style={{ cursor: "pointer", listStyle: "none", marginBottom: 12 }}>
              <h3 style={{ display: "inline", fontSize: 14, color: "var(--cor-texto-suave)", margin: 0 }}>
                Treinos anteriores ({planosAnteriores.length}) ›
              </h3>
            </summary>

            <div className="grade-auto grade-auto--2">
              {planosAnteriores.map((plano: any) => (
                <CartaoTreino
                  key={plano.id}
                  titulo={plano.titulo}
                  href={`/exercicios?treino=${plano.id}`}
                  encerrado
                  itens={[...(plano.plano_exercicios ?? [])]
                    .sort((a: any, b: any) => a.ordem - b.ordem)
                    .map((item: any) => ({
                      id: item.id,
                      titulo: item.exercicios.titulo,
                      video_url: item.exercicios.video_url,
                      pdf_url: item.exercicios.pdf_url,
                    }))}
                />
              ))}
            </div>
          </details>
        )}
      </main>

      <Assistente whatsapp={configClinica?.whatsapp_contato} />

      <BottomNav papel={ehAdmin ? "admin" : "paciente"} />
    </>
  );
}

async function VisaoAdmin({
  pacienteSelecionado,
  sucesso,
}: {
  pacienteSelecionado?: string;
  sucesso?: string;
}) {
  const supabase = createClient();

  const [{ data: pacientes }, { data: biblioteca }] = await Promise.all([
    // Sem o filtro de arquivado, quem já teve alta continuava no seletor —
    // o painel filtra, essa tela não filtrava.
    supabase
      .from("perfis")
      .select("id, nome, email")
      .eq("papel", "paciente")
      .is("arquivado_em", null)
      .order("nome"),
    supabase.from("exercicios").select("id, titulo").order("titulo"),
  ]);

  let planos: any[] | null = null;
  if (pacienteSelecionado) {
    const { data } = await supabase
      .from("planos")
      .select(
        "id, titulo, ativo, plano_exercicios(id, series, repeticoes, ordem, exercicio_id, exercicios(id, titulo, descricao, video_url, series_padrao, repeticoes_padrao))"
      )
      .eq("paciente_id", pacienteSelecionado)
      .order("criado_em", { ascending: false });
    planos = data ?? [];
  }

  return (
    <>
      <Feedback mensagem={sucesso} />
      <MantemPosicao />
      <Header titulo="Exercícios por paciente" subtitulo="Beatriz Coutinho Fisioterapia" variante="boasVindas" />

      <main className="conteudo">
        <SeletorPaciente pacientes={pacientes ?? []} selecionado={pacienteSelecionado} />

        {!pacienteSelecionado && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14, marginTop: 16 }}>
            Selecione um paciente para ver e editar os exercícios dos planos dele.
          </p>
        )}

        {pacienteSelecionado && (!planos || planos.length === 0) && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14, marginTop: 16 }}>
            Esse paciente ainda não tem nenhum plano. Monte um em "Painel".
          </p>
        )}

        {pacienteSelecionado &&
          (planos ?? []).map((plano) => {
            const itensOrdenados = [...(plano.plano_exercicios ?? [])].sort(
              (a: any, b: any) => a.ordem - b.ordem
            );
            const idsNoPlano = new Set(itensOrdenados.map((i: any) => i.exercicio_id));
            const disponiveisParaAdicionar = (biblioteca ?? []).filter((ex) => !idsNoPlano.has(ex.id));

            return (
              <section key={plano.id} style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 15, color: "var(--cor-primaria)", marginBottom: 10 }}>
                  {plano.titulo} {!plano.ativo && "· inativo"}
                </h3>

                <div style={{ display: "grid", gap: 10 }}>
                  {itensOrdenados.map((item: any) => {
                    const ex = item.exercicios;
                    return (
                      <div key={item.id} style={exercicioCartao}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <strong>{ex.titulo}</strong>
                          <form action={removerItemPlano.bind(null, item.id)}>
                            <input type="hidden" name="_paciente" value={pacienteSelecionado} />
                            <button type="submit" style={botaoTexto}>
                              remover do plano
                            </button>
                          </form>
                        </div>

                        {ex.video_url && (
                          <div style={{ marginTop: 8, maxWidth: 200 }}>
                            <MidiaExercicio url={ex.video_url} />
                          </div>
                        )}

                        <form
                          action={atualizarItemPlano.bind(null, item.id)}
                          style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}
                        >
                          <input type="hidden" name="_paciente" value={pacienteSelecionado} />
                          <input
                            name="series"
                            type="number"
                            defaultValue={item.series ?? ex.series_padrao ?? ""}
                            placeholder="séries"
                            style={campoPequeno}
                          />
                          <span style={{ color: "var(--cor-texto-suave)" }}>×</span>
                          <input
                            name="repeticoes"
                            type="number"
                            defaultValue={item.repeticoes ?? ex.repeticoes_padrao ?? ""}
                            placeholder="reps"
                            style={campoPequeno}
                          />
                          <button type="submit" style={botaoTextoPrimario}>
                            salvar
                          </button>
                        </form>
                      </div>
                    );
                  })}
                  {itensOrdenados.length === 0 && (
                    <p style={{ color: "var(--cor-texto-suave)", fontSize: 13 }}>
                      Nenhum exercício neste plano ainda.
                    </p>
                  )}
                </div>

                {disponiveisParaAdicionar.length > 0 && (
                  <form
                    action={adicionarExercicioAoPlano.bind(null, plano.id)}
                    style={{ display: "flex", gap: 8, marginTop: 12 }}
                  >
                    <input type="hidden" name="_paciente" value={pacienteSelecionado} />
                    <select name="exercicio_id" required style={campo}>
                      <option value="">Adicionar exercício ao plano…</option>
                      {disponiveisParaAdicionar.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.titulo}
                        </option>
                      ))}
                    </select>
                    <button type="submit" style={botaoPrimario}>
                      Adicionar
                    </button>
                  </form>
                )}
              </section>
            );
          })}
      </main>

      <BottomNav papel="admin" />
    </>
  );
}

const exercicioCartao: React.CSSProperties = {
  border: "1px solid var(--cor-borda)",
  borderRadius: 10,
  padding: "14px 16px",
  background: "var(--cor-superficie)",
};

const campo: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  fontSize: 14,
  fontFamily: "var(--fonte-corpo)",
  width: "100%",
};

const campoPequeno: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  fontSize: 13,
  fontFamily: "var(--fonte-corpo)",
  width: 72,
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
  whiteSpace: "nowrap",
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
};
