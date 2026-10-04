"use client";

import { useState } from "react";

const PASSOS = [
  {
    titulo: "Sua agenda",
    texto: "Em Início você vê suas sessões da semana e pode solicitar uma nova sessão quando quiser.",
  },
  {
    titulo: "Seus exercícios",
    texto: "Em Exercícios ficam os treinos que a Beatriz montou pra você, com vídeo ou gif de demonstração.",
  },
  {
    titulo: "Fale com a Beatriz",
    texto: "Em Perfil você encontra o WhatsApp da clínica, o endereço do consultório e pode editar seus dados.",
  },
];

export function GuiaPrimeirosPassos({ onFechar }: { onFechar?: () => void | Promise<void> }) {
  const [visivel, setVisivel] = useState(true);

  if (!visivel) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: "16px 18px",
        borderRadius: 14,
        background: "linear-gradient(135deg, var(--cor-primaria-escura), var(--cor-primaria))",
        color: "#fff",
        marginBottom: 24,
      }}
    >
      <strong style={{ fontFamily: "var(--fonte-titulo)", fontSize: 17 }}>Bem-vindo(a)! 👋</strong>

      {PASSOS.map((passo) => (
        <div key={passo.titulo}>
          <strong style={{ fontSize: 13.5 }}>{passo.titulo}</strong>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.88)" }}>{passo.texto}</p>
        </div>
      ))}

      <button
        type="button"
        onClick={async () => {
          setVisivel(false);
          await onFechar?.();
        }}
        style={{
          justifySelf: "start",
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.12)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Entendi
      </button>
    </div>
  );
}
