export type StatusSessao = "solicitada" | "rejeitada" | "agendada" | "confirmada" | "recusada";

/**
 * Paleta dos status.
 *
 * A primeira versão usava vermelho e amarelo fortes, de semáforo. Num cartão
 * que já tinha a cor do tipo de sessão, viravam duas escalas de cor brigando
 * e o início da paciente ficava parecendo painel de alerta. Agora os tons
 * saem da identidade da marca — verde-petróleo e terracota —, bem lavados, e
 * o que não exige nada dela ("aguardando") é neutro de propósito: só o que
 * pede ação ou já está resolvido ganha cor.
 */
export const STATUS_SESSAO: {
  valor: StatusSessao;
  rotulo: string;
  rotuloCurto: string;
  cor: string;
  corFundo: string;
  corBorda: string;
}[] = [
  {
    valor: "solicitada",
    rotulo: "Aguardando aprovação da fisioterapeuta",
    rotuloCurto: "Solicitada",
    cor: "#8a6a42",
    corFundo: "#f7f1e8",
    corBorda: "#e8dac6",
  },
  {
    valor: "rejeitada",
    rotulo: "Não foi possível agendar",
    rotuloCurto: "Não aprovada",
    cor: "#9c4259",
    corFundo: "#f8ebee",
    corBorda: "#edd3da",
  },
  {
    valor: "agendada",
    rotulo: "Aguardando sua confirmação",
    rotuloCurto: "A confirmar",
    cor: "#5c6b68",
    corFundo: "#eff2f0",
    corBorda: "#dde3e0",
  },
  {
    valor: "confirmada",
    rotulo: "Presença confirmada",
    rotuloCurto: "Confirmada",
    cor: "#2f6b52",
    corFundo: "#e6f1ea",
    corBorda: "#cde0d4",
  },
  {
    valor: "recusada",
    rotulo: "Você avisou que não vai",
    rotuloCurto: "Desmarcada",
    cor: "#9c4259",
    corFundo: "#f8ebee",
    corBorda: "#edd3da",
  },
];

function item(status: string | null | undefined) {
  return STATUS_SESSAO.find((s) => s.valor === status);
}

export function rotuloStatusSessao(status: string | null | undefined, curto = false): string {
  const encontrado = item(status);
  if (!encontrado) return curto ? "A confirmar" : "Aguardando sua confirmação";
  return curto ? encontrado.rotuloCurto : encontrado.rotulo;
}

export function corStatusSessao(status: string | null | undefined): string {
  return item(status)?.cor ?? "#5c6b68";
}

export function corFundoStatusSessao(status: string | null | undefined): string {
  return item(status)?.corFundo ?? "#eff2f0";
}

export function corBordaStatusSessao(status: string | null | undefined): string {
  return item(status)?.corBorda ?? "#dde3e0";
}

export const MOTIVOS_RECUSA_SUGERIDOS = [
  "Imprevisto",
  "Estou doente",
  "Sem transporte",
  "Vou precisar remarcar",
];
