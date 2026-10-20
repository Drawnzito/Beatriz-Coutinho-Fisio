import {
  rotuloStatusSessao,
  corStatusSessao,
  corFundoStatusSessao,
  corBordaStatusSessao,
} from "@/lib/statusSessao";

/**
 * Selo de situação da sessão.
 *
 * O ponto colorido saiu: com o selo já inteiro na cor do status, ele era a
 * terceira marca de cor no mesmo cartão. Ficou um contorno de 1px, que lê
 * como etiqueta em vez de marca-texto.
 */
export function BadgeStatusSessao({
  status,
  motivoRecusa,
  curto = false,
}: {
  status: string | null | undefined;
  motivoRecusa?: string | null;
  curto?: boolean;
}) {
  return (
    <span
      title={status === "recusada" && motivoRecusa ? `Motivo: ${motivoRecusa}` : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        border: `1px solid ${corBordaStatusSessao(status)}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.2,
        color: corStatusSessao(status),
        background: corFundoStatusSessao(status),
        whiteSpace: "nowrap",
      }}
    >
      {rotuloStatusSessao(status, curto)}
    </span>
  );
}
