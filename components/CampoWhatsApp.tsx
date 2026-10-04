"use client";

import { useState } from "react";
import { atualizarMeuWhatsapp } from "@/app/perfil/actions";

function formatarTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  let saida = `(${ddd}`;
  if (digitos.length > 2) {
    const quebraEm = digitos.length > 10 ? 5 : 4;
    const parte1 = resto.slice(0, quebraEm);
    const parte2 = resto.slice(quebraEm);
    saida += `) ${parte1}`;
    if (parte2) saida += `-${parte2}`;
  }
  return saida;
}

export function CampoWhatsApp({ valorInicial }: { valorInicial: string | null | undefined }) {
  const [editando, setEditando] = useState(!valorInicial);
  const [valor, setValor] = useState(valorInicial || "");

  if (!editando) {
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>Seu WhatsApp</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, color: "var(--cor-texto)" }}>📱 {valorInicial}</span>
          <button type="button" onClick={() => setEditando(true)} style={botaoLink}>
            editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={atualizarMeuWhatsapp} style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>Seu WhatsApp</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          name="whatsapp"
          placeholder="(81) 99999-9999"
          value={valor}
          onChange={(e) => setValor(formatarTelefone(e.target.value))}
          style={campo}
        />
        <button type="submit" style={botaoSalvar}>Salvar</button>
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: "var(--cor-texto-suave)" }}>
        Assim a Beatriz consegue falar com você sempre que precisar, por exemplo pra confirmar ou reagendar uma sessão.
      </p>
    </form>
  );
}

const campo: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  fontSize: 13.5,
};

const botaoSalvar: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
};

const botaoLink: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--cor-acento)",
  fontWeight: 600,
  fontSize: 12.5,
  cursor: "pointer",
  padding: 0,
};
