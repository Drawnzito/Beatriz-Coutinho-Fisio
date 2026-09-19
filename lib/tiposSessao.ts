export type TipoSessao = "avaliacao_inicial" | "tratamento" | "reavaliacao" | "alta";

export const TIPOS_SESSAO: { valor: TipoSessao; rotulo: string; cor: string }[] = [
  { valor: "avaliacao_inicial", rotulo: "Avaliação inicial", cor: "var(--cor-acento)" },
  { valor: "tratamento", rotulo: "Sessão de tratamento", cor: "var(--cor-primaria)" },
  { valor: "reavaliacao", rotulo: "Reavaliação", cor: "#8a6d1f" },
  { valor: "alta", rotulo: "Alta", cor: "#3a7a4e" },
];

export function rotuloTipoSessao(tipo: string | null | undefined): string {
  return TIPOS_SESSAO.find((t) => t.valor === tipo)?.rotulo ?? "Sessão de tratamento";
}

export function corTipoSessao(tipo: string | null | undefined): string {
  return TIPOS_SESSAO.find((t) => t.valor === tipo)?.cor ?? "var(--cor-primaria)";
}
