import { CLINICA } from "@/lib/clinica";

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function InfoContatoClinica({
  whatsapp,
  mostrarBotaoWhatsapp = true,
}: {
  whatsapp?: string | null;
  mostrarBotaoWhatsapp?: boolean;
}) {
  const numero = whatsapp ? somenteDigitos(whatsapp) : "";

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid var(--cor-borda)",
        background: "var(--cor-superficie)",
      }}
    >
      <div>
        <strong style={{ fontSize: 13.5, color: "var(--cor-primaria-escura)", display: "block" }}>
          {CLINICA.local}
        </strong>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>{CLINICA.endereco}</p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href={CLINICA.mapaUrl} target="_blank" rel="noreferrer" style={botaoSecundario}>
          📍 Ver no mapa
        </a>
        {mostrarBotaoWhatsapp && numero && (
          <a
            href={`https://wa.me/${numero}`}
            target="_blank"
            rel="noreferrer"
            style={{ ...botaoSecundario, background: "#25D366", color: "#fff", border: "1px solid #25D366" }}
          >
            💬 Falar no WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

const botaoSecundario: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-fundo)",
  color: "var(--cor-primaria-escura)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};
