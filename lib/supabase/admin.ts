import { createClient } from "@supabase/supabase-js";

/**
 * Client com a service role key — ignora RLS. Só pode ser usado em
 * código que roda no servidor e nunca deve ser exposto ao navegador
 * (ex: a rota de cron que envia notificações pra todo mundo).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
