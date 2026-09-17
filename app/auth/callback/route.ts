import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?erro=auth_sem_codigo`
    );
  }

  const supabase = createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Erro ao criar sessão do Supabase:", error);

    return NextResponse.redirect(
      `${origin}/login?erro=auth`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
