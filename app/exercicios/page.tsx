import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { Feedback } from "@/components/Feedback";
import { SeletorPaciente } from "@/components/SeletorPaciente";
import { redirect } from "next/navigation";
import { atualizarItemPlano, removerItemPlano, adicionarExercicioAoPlano } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage({
  searchParams,
}: {
  searchParams: { paciente?: string; sucesso?: string };
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

  const ehAdmin = perfil?.papel === "admin";

  if (ehAdmin) {
    return (
      <VisaoAdmin
        pacienteSelecionado={searchParams.paciente}
        sucesso={searchParams.sucesso}
      />
    );
  }

  const { data: planos } = await supabase
    .from("planos")
    .select("id, titulo, plano_exercicios(id, series, repeticoes, ordem, exercicios(*))")
    .eq("paciente_id", user.id)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  return (
    <>
      <Header titulo="Seus exercícios" subtitulo="Beatriz Coutinho Fisioterapia" />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 100px" }}>
        {(!planos || planos.length === 0) && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
            Nenhum plano atribuído ainda. Assim que a Beatriz montar o seu, ele aparece aqui.
          </p>
        )}

        {(planos ?? []).map((plano: any) => (
          <div key={plano.id} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, color: "var(--cor-texto)", marginBottom: 10 }}>{plano.titulo}</h3>

            <div style={{ display: "grid", gap: 10 }}>
              {(plano.plano_exercicios ?? [])
                .sort((a: any, b: any) => a.ordem - b.ordem)
                .map((item: any) => {
                  const ex = item.exercicios;
                  return (
                    <div key={item.id} style={exercicioCartao}>
                      <strong>{ex.titulo}</strong>
                      <p style={{ margin: "4px 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                        {item.series ?? ex.series_padrao ?? "-"} séries ×{" "}
                        {item.repeticoes ?? ex.repeticoes_padrao ?? "-"} repetições
                      </p>
                      {ex.descricao && (
                        <p style={{ margin: "4px 0", fontSize: 13 }}>{ex.descricao}</p>
                      )}
                      {ex.video_url && (
                        <div style={{ marginTop: 8 }}>
                          <MidiaExercicio url={ex.video_url} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </main>

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
    supabase.from("perfis").select("id, nome, email").eq("papel", "paciente").order("nome"),
    supabase.from("exercicios").select("id, titulo").order("titulo"),
  ]);

  let planos: any[] | null = null;
  if (pacienteSelecionado) {
    const { data } = await supabase
      .from("planos")
      .select(
        "id, titulo, ativo, plano_exercicios(id, series, repeticoes, ordem, exercicio_id, exercicios(*))"
      )
      .eq("paciente_id", pacienteSelecionado)
      .order("criado_em", { ascending: false });
    planos = data ?? [];
  }

  return (
    <>
      <Feedback mensagem={sucesso} />
      <Header titulo="Exercícios por paciente" subtitulo="Beatriz Coutinho Fisioterapia" />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 100px" }}>
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
