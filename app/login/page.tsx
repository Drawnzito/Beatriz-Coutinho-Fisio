"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MENSAGENS_ERRO: Record<string, string> = {
  auth_sem_codigo:
    "O Google não retornou um código de autenticação. Tente entrar novamente.",
  auth: "Não foi possível concluir o login. Tente novamente em instantes.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const mensagemErro = erro ? MENSAGENS_ERRO[erro] ?? "Algo deu errado ao entrar. Tente novamente." : null;

  async function entrarComGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--cor-superficie)",
          border: "1px solid var(--cor-borda)",
          borderRadius: 12,
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--cor-primaria)",
            margin: "0 0 4px",
          }}
        >
          Beatriz Coutinho
        </p>
        <p
          style={{
            fontSize: 13,
            letterSpacing: 3,
            color: "var(--cor-acento)",
            margin: "0 0 32px",
          }}
        >
          FISIOTERAPIA
        </p>

        <p style={{ color: "var(--cor-texto-suave)", fontSize: 14, margin: "0 0 24px" }}>
          Entre com sua conta Google para ver seus exercícios e sessões.
        </p>

        {mensagemErro && (
          <p
            style={{
              background: "#fdecea",
              color: "#b3261e",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              margin: "0 0 20px",
              textAlign: "left",
            }}
          >
            {mensagemErro}
          </p>
        )}

        <button
          onClick={entrarComGoogle}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid var(--cor-borda)",
            background: "#fff",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cor-texto)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.6 5.4C41.8 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    </main>
  );
}
