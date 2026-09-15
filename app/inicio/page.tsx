import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";

export default async function InicioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", user?.id)
    .single();

  const { data: planos } = await supabase
    .from("planos")
    .select("id, titulo, plano_exercicios(id, series, repeticoes, ordem, exercicios(*))")
    .eq("paciente_id", user?.id)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  const { data: avisos } = await supabase
    .from("avisos")
    .select("*")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(5);

  return (
    <>
      <Header
        titulo={`Olá, ${perfil?.nome?.split(" ")[0] || "por aqui"}`}
        subtitulo="Beatriz Coutinho Fisioterapia"
      />

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
        {(avisos ?? []).length > 0 && (
          <section style={{ marginBottom: 32 }}>
            {(avisos ?? []).map((a) => (
              <div key={a.id} style={avisoCartao}>
                <strong style={{ color: "var(--cor-acento)", fontSize: 13 }}>{a.titulo}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 14 }}>{a.conteudo}</p>
              </div>
            ))}
          </section>
        )}

        <h2 style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria)", fontSize: 20 }}>
          Seus exercícios
        </h2>

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
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 13, color: "var(--cor-acento)" }}
                        >
                          Ver vídeo de demonstração →
                        </a>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}

const avisoCartao: React.CSSProperties = {
  background: "var(--cor-acento-suave)",
  borderRadius: 10,
  padding: "12px 14px",
  marginBottom: 8,
};

const exercicioCartao: React.CSSProperties = {
  border: "1px solid var(--cor-borda)",
  borderRadius: 10,
  padding: "14px 16px",
  background: "var(--cor-superficie)",
};
