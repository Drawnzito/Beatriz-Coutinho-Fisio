import { rotuloStatusSessao, corStatusSessao, corFundoStatusSessao } from "@/lib/statusSessao";

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
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        color: corStatusSessao(status),
        background: corFundoStatusSessao(status),
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: corStatusSessao(status),
          flexShrink: 0,
        }}
      />
      {rotuloStatusSessao(status, curto)}
    </span>
  );
}
