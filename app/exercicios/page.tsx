import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MidiaExercicio } from "@/components/MidiaExercicio";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExerciciosPage() {
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

      <BottomNav papel={perfil?.papel === "admin" ? "admin" : "paciente"} />
    </>
  );
}

const exercicioCartao: React.CSSProperties = {
  border: "1px solid var(--cor-borda)",
  borderRadius: 10,
  padding: "14px 16px",
  background: "var(--cor-superficie)",
};
