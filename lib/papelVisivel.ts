import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Qual papel a navegação deve mostrar nesta tela.
 *
 * Não é o papel no banco: a Beatriz pode estar com o modo "ver como paciente"
 * ligado, e aí ela precisa ver exatamente o que a paciente vê. /inicio,
 * /exercicios e /perfil já faziam essa conta cada um por conta própria — o
 * blog não fazia, e por isso a aba "Painel" continuava aparecendo na barra
 * durante o modo de teste. Centralizado aqui pra não escapar de novo.
 *
 * Devolve null pra quem não está logado (visitante do blog ou da página
 * pública), que não vê barra nenhuma do app.
 */
export async function papelVisivel(supabase: SupabaseClient): Promise<"admin" | "paciente" | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from("perfis").select("papel").eq("id", user.id).single();
  if (perfil?.papel !== "admin") return "paciente";

  return cookies().get("ver_como_paciente")?.value === "1" ? "paciente" : "admin";
}
