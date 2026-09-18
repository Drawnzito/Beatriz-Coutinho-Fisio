import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function rotuloData(data: Date): string {
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (mesmoDia(data, hoje)) return "Hoje";
  if (mesmoDia(data, ontem)) return "Ontem";
  if (mesmoDia(data, amanha)) return "Amanhã";

  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

type Evento =
  | { tipo: "aviso"; id: string; titulo: string; conteudo: string }
  | {
      tipo: "sessao";
      id: string;
      hora: string | null;
      status: string;
      observacoes: string | null;
      plano: any;
    };

export default async function InicioPage() {
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

  const [{ data: avisos }, { data: sessoes }] = await Promise.all([
    supabase.from("avisos").select("*").eq("ativo", true).order("criado_em", { ascending: false }),
    supabase
      .from("sessoes")
      .select(
        "id, data, hora, status, observacoes, planos(titulo, plano_exercicios(id, series, repeticoes, ordem, exercicios(*)))"
      )
      .eq("paciente_id", user.id)
      .order("data", { ascending: false }),
  ]);

  const grupos = new Map<string, { data: Date; itens: Evento[] }>();

  function adicionar(chave: string, data: Date, item: Evento) {
    if (!grupos.has(chave)) grupos.set(chave, { data, itens: [] });
    grupos.get(chave)!.itens.push(item);
  }

  for (const aviso of avisos ?? []) {
    const data = new Date(aviso.criado_em);
    adicionar(data.toDateString(), data, {
      tipo: "aviso",
      id: aviso.id,
      titulo: aviso.titulo,
      conteudo: aviso.conteudo,
    });
  }

  for (const sessao of (sessoes ?? []) as any[]) {
    const data = new Date(`${sessao.data}T00:00:00`);
    adicionar(data.toDateString(), data, {
      tipo: "sessao",
      id: sessao.id,
      hora: sessao.hora,
      status: sessao.status,
      observacoes: sessao.observacoes,
      plano: sessao.planos,
    });
  }

  const gruposOrdenados = [...grupos.values()].sort((a, b) => b.data.getTime() - a.data.getTime());

  return (
    <>
      <Header
        titulo={`Olá, ${perfil?.nome?.split(" ")[0] || "por aqui"}`}
        subtitulo="Beatriz Coutinho Fisioterapia"
        avatarUrl={user.user_metadata?.avatar_url}
      />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 100px" }}>
        <h2
          style={{
            fontFamily: "var(--fonte-titulo)",
            color: "var(--cor-primaria)",
            fontSize: 20,
            marginBottom: 20,
          }}
        >
          Sua agenda
        </h2>

        {gruposOrdenados.length === 0 && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
            Nada por aqui ainda. Quando a Beatriz publicar um aviso ou agendar uma sessão, aparece nesta agenda.
          </p>
        )}

        <div style={{ display: "grid", gap: 24 }}>
          {gruposOrdenados.map(({ data, itens }) => (
            <div key={data.toDateString()} style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flexShrink: 0 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--cor-primaria)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {data.getDate()}
                </div>
                <div style={{ flex: 1, width: 2, background: "var(--cor-borda)", marginTop: 6 }} />
              </div>

              <div style={{ flex: 1, paddingBottom: 4 }}>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--cor-texto-suave)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {rotuloData(data)}
                </p>

                <div style={{ display: "grid", gap: 10 }}>
                  {itens.map((item) =>
                    item.tipo === "aviso" ? (
                      <div key={item.id} style={avisoCartao}>
                        <strong style={{ color: "var(--cor-acento)", fontSize: 13 }}>{item.titulo}</strong>
                        <p style={{ margin: "4px 0 0", fontSize: 14 }}>{item.conteudo}</p>
                      </div>
                    ) : (
                      <div key={item.id} style={sessaoCartao}>
                        <strong style={{ color: "var(--cor-primaria)", fontSize: 13 }}>
                          Sessão de fisioterapia{item.hora ? ` · ${item.hora.slice(0, 5)}` : ""}
                        </strong>
                        {item.observacoes && (
                          <p style={{ margin: "4px 0 0", fontSize: 14 }}>{item.observacoes}</p>
                        )}

                        {item.plano && (
                          <div style={{ marginTop: 10 }}>
                            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>
                              Plano: {item.plano.titulo}
                            </p>
                            <div style={{ display: "grid", gap: 8 }}>
                              {(item.plano.plano_exercicios ?? [])
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
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav papel={perfil?.papel === "admin" ? "admin" : "paciente"} />
    </>
  );
}

const avisoCartao: React.CSSProperties = {
  background: "var(--cor-acento-suave)",
  borderRadius: 10,
  padding: "12px 14px",
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
