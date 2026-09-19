"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Marca } from "@/components/Marca";
import { AcentoArabesque, AcentoCadencia } from "@/components/Acentos";
import styles from "./login.module.css";

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

  const [fase, setFase] = useState<"abertura" | "entrada">("abertura");

  useEffect(() => {
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setFase("entrada"), reduzMovimento ? 300 : 6800);
    return () => clearTimeout(t);
  }, []);

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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(120% 70% at 20% 0%, rgba(255,255,255,0.10), transparent 55%), linear-gradient(165deg, var(--cor-primaria) 0%, var(--cor-primaria-escura) 78%)",
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 260 540"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
      >
        <path d="M 30 40 C 10 100, 60 140, 40 200" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.22" />
        <path d="M 220 70 C 250 130, 195 170, 225 230" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.22" />
        <circle cx="40" cy="200" r="3.4" fill="#fff" opacity="0.3" />
        <circle cx="30" cy="40" r="3.4" fill="#fff" opacity="0.3" />
        <path
          d="M 20 300 C 70 270, 90 330, 150 300 C 190 280, 210 320, 245 300"
          fill="none"
          stroke="#fff"
          strokeWidth="1.2"
          opacity="0.16"
        />
      </svg>
      <div
        aria-hidden="true"
        style={{ position: "absolute", right: -32, bottom: -24, opacity: 0.08, pointerEvents: "none" }}
      >
        <Marca tamanho={280} corB="#fff" corC="#fff" />
      </div>

      {fase === "abertura" && (
        <div className={styles.abertura}>
          <div className={styles.brilho} />

          <AcentoArabesque
            tamanho={260}
            cor="#ffffff"
            opacidade={0.16}
            animada
            atraso={0.5}
            style={{ position: "absolute", left: -70, bottom: -30, transform: "scaleX(-1)" }}
          />

          <Marca animada tamanho={150} corB="#ffffff" corC="rgba(255,255,255,0.82)" />

          <svg className={styles.barra} width="150" height="14" viewBox="0 0 150 14" aria-hidden="true">
            <line x1="5" y1="7" x2="145" y2="7" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
            <line x1="5" y1="2" x2="5" y2="12" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
            <line x1="145" y1="2" x2="145" y2="12" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
          </svg>

          <p className={styles.nomeCompleto}>Beatriz Coutinho</p>
          <p className={styles.tagline}>FISIOTERAPIA</p>

          <button className={styles.pular} onClick={() => setFase("entrada")}>
            toque para continuar
          </button>
        </div>
      )}

      {fase === "entrada" && (
        <div
          className={styles.cartao}
          style={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            maxWidth: 380,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 18,
            padding: "32px 28px",
            textAlign: "center",
            boxShadow: "0 24px 50px -18px rgba(22,63,60,0.45)",
            backdropFilter: "blur(6px)",
          }}
        >
          <AcentoArabesque
            tamanho={150}
            opacidade={0.07}
            style={{ position: "absolute", right: -24, bottom: -14, zIndex: -1, pointerEvents: "none" }}
          />

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Marca tamanho={44} />
          </div>

          <p
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: 19,
              fontWeight: 700,
              color: "var(--cor-primaria-escura)",
              margin: "0 0 10px",
            }}
          >
            Que bom ter você de volta
          </p>

          <AcentoCadencia
            largura={110}
            opacidade={0.5}
            style={{ display: "block", margin: "0 auto 18px" }}
          />

          <p style={{ position: "relative", color: "var(--cor-texto-suave)", fontSize: 14, margin: "0 0 24px" }}>
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
      )}
    </main>
  );
}
