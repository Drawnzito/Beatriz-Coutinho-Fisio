"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Marca } from "@/components/Marca";
import { AcentoArabesque, AcentoCadencia } from "@/components/Acentos";
import styles from "./login.module.css";

/** Tempo da vinheta de abertura. Precisa casar com os delays do login.module.css. */
const DURACAO_VINHETA_MS = 3000;

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
    // 3s fixos, com ou sem animacao. Antes caia pra 300ms quando o sistema
    // pedia menos movimento (o padrao de varios Windows), e a vinheta sumia
    // num piscar no computador enquanto rodava inteira no celular.
    // "Menos movimento" aqui significa mostrar a marca parada, nao esconder.
    const t = setTimeout(() => setFase("entrada"), DURACAO_VINHETA_MS);
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
            maxWidth: 400,
            background: "linear-gradient(170deg, #ffffff 0%, #fdfbf8 100%)",
            borderRadius: 26,
            padding: "40px 32px 34px",
            textAlign: "center",
            boxShadow: "0 30px 70px -22px rgba(10,40,38,0.55)",
          }}
        >
          {/* Fio terracota no topo: a mesma cor do ponto da marca, costurando
              a vinheta ao cartão em vez de cortar seco pro branco. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background:
                "linear-gradient(90deg, transparent, var(--cor-acento) 25%, var(--cor-acento) 75%, transparent)",
            }}
          />

          <AcentoArabesque
            tamanho={190}
            opacidade={0.08}
            style={{ position: "absolute", right: -40, bottom: -28, pointerEvents: "none" }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 82,
              height: 82,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "var(--cor-acento-suave)",
            }}
          >
            <Marca tamanho={48} />
          </div>

          <p
            style={{
              position: "relative",
              fontFamily: "var(--fonte-titulo)",
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "var(--cor-primaria-escura)",
              margin: "0 0 6px",
            }}
          >
            Que bom ter você de volta
          </p>

          <p
            style={{
              position: "relative",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2.6,
              color: "var(--cor-acento)",
              margin: "0 0 14px",
            }}
          >
            BEATRIZ COUTINHO
          </p>

          <AcentoCadencia
            largura={120}
            opacidade={0.55}
            style={{ display: "block", margin: "0 auto 20px" }}
          />

          <p
            style={{
              position: "relative",
              color: "var(--cor-texto-suave)",
              fontSize: 14.5,
              lineHeight: 1.55,
              margin: "0 0 26px",
            }}
          >
            Entre para ver seus exercícios, suas sessões e a sua evolução.
          </p>

          {mensagemErro && (
            <p
              style={{
                background: "#fdecea",
                color: "#b3261e",
                borderRadius: 10,
                padding: "11px 13px",
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
              position: "relative",
              width: "100%",
              padding: "14px 16px",
              borderRadius: 999,
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
              boxShadow: "0 6px 16px -8px rgba(22,63,60,0.4)",
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

          <p
            style={{
              position: "relative",
              margin: "16px 0 0",
              fontSize: 11.5,
              lineHeight: 1.5,
              color: "var(--cor-texto-suave)",
            }}
          >
            O Google vai pedir confirmação numa tela dele antes de voltar pra cá.
          </p>
        </div>
      )}
    </main>
  );
}
