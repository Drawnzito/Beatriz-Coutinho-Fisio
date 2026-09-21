export type StatusSessao = "agendada" | "confirmada" | "recusada";

export const STATUS_SESSAO: { valor: StatusSessao; rotulo: string; rotuloCurto: string; cor: string; corFundo: string }[] = [
  { valor: "agendada", rotulo: "Aguardando confirmação", rotuloCurto: "Pendente", cor: "#8a7a5c", corFundo: "#f1ece0" },
  { valor: "confirmada", rotulo: "Presença confirmada", rotuloCurto: "Confirmada", cor: "#2f7a4f", corFundo: "#dcefe1" },
  { valor: "recusada", rotulo: "Não vai comparecer", rotuloCurto: "Recusada", cor: "#a2334a", corFundo: "#f4dde1" },
];

export function rotuloStatusSessao(status: string | null | undefined, curto = false): string {
  const item = STATUS_SESSAO.find((s) => s.valor === status);
  if (!item) return curto ? "Pendente" : "Aguardando confirmação";
  return curto ? item.rotuloCurto : item.rotulo;
}

export function corStatusSessao(status: string | null | undefined): string {
  return STATUS_SESSAO.find((s) => s.valor === status)?.cor ?? "#8a7a5c";
}

export function corFundoStatusSessao(status: string | null | undefined): string {
  return STATUS_SESSAO.find((s) => s.valor === status)?.corFundo ?? "#f1ece0";
}

export const MOTIVOS_RECUSA_SUGERIDOS = [
  "Imprevisto",
  "Estou doente",
  "Sem transporte",
  "Vou precisar remarcar",
];
