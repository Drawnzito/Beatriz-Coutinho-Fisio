export function DiaEmDestaque({
  numero,
  rotulo,
  contagem,
}: {
  numero: number;
  rotulo: string;
  contagem?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 16,
        background: "linear-gradient(155deg, var(--cor-primaria), var(--cor-primaria-escura))",
        color: "#fff",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div>
        <div style={{ fontFamily: "var(--fonte-titulo)", fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
          {numero}
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.85, marginTop: 3 }}>
          {rotulo}
        </div>
      </div>
      {contagem !== undefined && contagem > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,.16)",
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {contagem} sessão{contagem > 1 ? "ões" : ""}
        </div>
      )}
    </div>
  );
}
