import { createClient } from "@/lib/supabase/server";

export default async function InicioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ padding: 32, fontFamily: "var(--fonte-corpo)" }}>
      <h1 style={{ fontFamily: "var(--fonte-titulo)", color: "var(--cor-primaria)" }}>
        Login funcionando ✅
      </h1>
      <p>Usuário autenticado: {user?.email}</p>
      <p style={{ color: "var(--cor-texto-suave)" }}>
        Próxima etapa: tabela de perfis (paciente/admin) e o treino do dia aqui.
      </p>
    </main>
  );
}
