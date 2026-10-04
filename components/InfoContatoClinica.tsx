const ENDERECO = {
  nome: "Resilience Saúde Center - Pilates | Osteopatia | Fisioterapia",
  linha: "R. Cel. João Rufino, 53 - Poço da Panela, Recife - PE, 52061-110",
  mapaUrl:
    "https://www.google.com.br/maps/place/Resilience+Sa%C3%BAde+Center+-+Pilates+%7C+Osteopatia+%7C+Fisioterapia/@-8.0313253,-34.9260835,17z/data=!3m1!4b1!4m6!3m5!1s0x7ab19a438b58605:0x175a2ea9490581a0!8m2!3d-8.0313253!4d-34.9235086!16s%2Fg%2F11g8gthr6g",
};

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
          {ENDERECO.nome}
        </strong>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>{ENDERECO.linha}</p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href={ENDERECO.mapaUrl} target="_blank" rel="noreferrer" style={botaoSecundario}>
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
