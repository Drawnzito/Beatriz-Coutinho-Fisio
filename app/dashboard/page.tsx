import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { redirect } from "next/navigation";
import {
  criarExercicio,
  removerExercicio,
  criarAviso,
  removerAviso,
  criarPlano,
  criarSessao,
  removerSessao,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const [{ data: exercicios }, { data: pacientes }, { data: avisos }, { data: planos }, { data: sessoes }] =
    await Promise.all([
      supabase.from("exercicios").select("*").order("criado_em", { ascending: false }),
      supabase.from("perfis").select("id, nome, email").eq("papel", "paciente"),
      supabase.from("avisos").select("*").order("criado_em", { ascending: false }),
      supabase
        .from("planos")
        .select("id, titulo, ativo, paciente_id, perfis(nome, email)")
        .order("criado_em", { ascending: false }),
      supabase
        .from("sessoes")
        .select("id, data, hora, status, observacoes, paciente_id, perfis(nome, email), planos(titulo)")
        .order("data", { ascending: false }),
    ]);

  return (
    <>
      <Header
        titulo="Beatriz Coutinho"
        subtitulo="Painel da fisioterapeuta"
        avatarUrl={user.user_metadata?.avatar_url}
      />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 100px" }}>
        {/* ---------- Biblioteca de exercícios ---------- */}
        <Secao titulo="Biblioteca de exercícios">
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

          <div style={{ display: "grid", gap: 10 }}>
            {(exercicios ?? []).map((ex) => (
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
            {(!exercicios || exercicios.length === 0) && (
              <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                Nenhum exercício cadastrado ainda.
              </p>
            )}
          </div>
        </Secao>

        {/* ---------- Montar plano para um paciente ---------- */}
        <Secao titulo="Montar plano para um paciente">
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
        </Secao>

        {/* ---------- Agenda de sessões ---------- */}
        <Secao titulo="Agendar sessão">
          {(pacientes ?? []).length === 0 ? (
            <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
              Nenhum paciente logou ainda — peça pra ele entrar com Google uma vez no app.
            </p>
          ) : (
            <form action={criarSessao} style={{ display: "grid", gap: 10 }}>
              <select name="paciente_id" required style={campo}>
                <option value="">Selecione o paciente</option>
                {(pacientes ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome || p.email}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10 }}>
                <input name="data" type="date" required style={campo} />
                <input name="hora" type="time" style={campo} />
              </div>

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

          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            {(sessoes ?? []).map((s: any) => (
              <div key={s.id} style={cartao}>
                <div>
                  <strong>
                    {new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    {s.hora ? ` às ${s.hora.slice(0, 5)}` : ""}
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                    {s.perfis?.nome || s.perfis?.email}
                    {s.planos?.titulo ? ` · plano: ${s.planos.titulo}` : ""}
                  </p>
                  {s.observacoes && (
                    <p style={{ margin: "4px 0 0", fontSize: 13 }}>{s.observacoes}</p>
                  )}
                </div>
                <form action={removerSessao.bind(null, s.id)}>
                  <button type="submit" style={botaoTexto}>remover</button>
                </form>
              </div>
            ))}
            {(!sessoes || sessoes.length === 0) && (
              <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
                Nenhuma sessão agendada ainda.
              </p>
            )}
          </div>
        </Secao>

        {/* ---------- Avisos ---------- */}
        <Secao titulo="Mural de avisos">
          <form action={criarAviso} style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            <input name="titulo" placeholder="Título do aviso" required style={campo} />
            <textarea name="conteudo" placeholder="Mensagem" rows={2} required style={campo} />
            <button type="submit" style={botaoPrimario}>Publicar aviso</button>
          </form>

          <div style={{ display: "grid", gap: 10 }}>
            {(avisos ?? []).map((a) => (
              <div key={a.id} style={cartao}>
                <div>
                  <strong>{a.titulo}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
                    {a.conteudo}
                  </p>
                </div>
                <form action={removerAviso.bind(null, a.id)}>
                  <button type="submit" style={botaoTexto}>remover</button>
                </form>
              </div>
            ))}
          </div>
        </Secao>
      </main>

      <BottomNav papel="admin" />
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: 18,
          color: "var(--cor-primaria)",
          borderBottom: "1px solid var(--cor-borda)",
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        {titulo}
      </h2>
      {children}
    </section>
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
