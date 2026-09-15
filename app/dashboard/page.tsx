import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 32, fontFamily: "var(--fonte-corpo)" }}>
      <h1 style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria)" }}>
        Painel da fisioterapeuta
      </h1>
      <p>Logada como: {user?.email}</p>
      <p style={{ color: "var(--cor-texto-suave)" }}>
        Aqui vai entrar a criação de exercícios e atribuição de planos.
      </p>
    </main>
  );
}
