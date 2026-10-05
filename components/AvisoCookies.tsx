"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CHAVE = "aviso-cookies-visto";

/**
 * Aviso de cookies — informativo, não consentimento.
 *
 * O app usa só cookie estritamente necessário (sessão e preferência de
 * visualização). Pela LGPD, esse tipo dispensa consentimento prévio: exige
 * transparência. Por isso aqui há "Entendi" e um link pra política, e não
 * "aceitar/recusar" — oferecer recusa seria mentira, já que sem o cookie de
 * sessão não dá pra entrar.
 *
 * No dia em que entrar qualquer rastreador de análise ou publicidade, este
 * componente precisa virar um banner de consentimento de verdade, com opção
 * de recusa que realmente bloqueie o script.
 */
export function AvisoCookies() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHAVE)) setVisivel(true);
    } catch {
      // armazenamento bloqueado: não insiste, melhor não mostrar sempre
    }
  }, []);

  function fechar() {
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      // segue fechando mesmo sem conseguir lembrar
    }
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div
      role="region"
      aria-label="Aviso sobre cookies"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        zIndex: 40,
        maxWidth: 560,
        margin: "0 auto",
        padding: "14px 16px",
        borderRadius: 14,
        background: "var(--cor-primaria-escura)",
        color: "#fff",
        boxShadow: "0 16px 40px -16px rgba(10,40,38,0.7)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, flex: 1, minWidth: 220, fontSize: 12.5, lineHeight: 1.5 }}>
        Usamos apenas cookies necessários pra manter você conectada. Sem rastreadores
        e sem publicidade.{" "}
        <Link
          href="/politica-de-privacidade"
          style={{ color: "#fff", fontWeight: 700, textDecoration: "underline" }}
        >
          Saiba mais
        </Link>
      </p>

      <button
        type="button"
        onClick={fechar}
        style={{
          padding: "8px 18px",
          borderRadius: 999,
          border: "none",
          background: "#fff",
          color: "var(--cor-primaria-escura)",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Entendi
      </button>
    </div>
  );
}
