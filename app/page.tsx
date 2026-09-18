import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  console.log("[home] user.id:", user.id, "perfil:", perfil, "erroPerfil:", erroPerfil);

  redirect(perfil?.papel === "admin" ? "/dashboard" : "/inicio");
}
