import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function rotuloData(data: Date): string {
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (mesmoDia(data, hoje)) return "Hoje";
  if (mesmoDia(data, ontem)) return "Ontem";

  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

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

  const { data: avisos } = await supabase
    .from("avisos")
    .select("*")
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  const grupos = new Map<string, { data: Date; itens: any[] }>();
  for (const aviso of avisos ?? []) {
    const data = new Date(aviso.criado_em);
    const chave = data.toDateString();
    if (!grupos.has(chave)) grupos.set(chave, { data, itens: [] });
    grupos.get(chave)!.itens.push(aviso);
  }

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

        {grupos.size === 0 && (
          <p style={{ color: "var(--cor-texto-suave)", fontSize: 14 }}>
            Nenhum aviso por aqui ainda. Quando a Beatriz publicar algo, aparece nesta agenda.
          </p>
        )}

        <div style={{ display: "grid", gap: 24 }}>
          {[...grupos.values()].map(({ data, itens }) => (
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
                  {itens.map((a) => (
                    <div key={a.id} style={avisoCartao}>
                      <strong style={{ color: "var(--cor-acento)", fontSize: 13 }}>{a.titulo}</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 14 }}>{a.conteudo}</p>
                    </div>
                  ))}
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
