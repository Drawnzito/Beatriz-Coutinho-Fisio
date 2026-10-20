export type TipoSessao = "avaliacao_inicial" | "tratamento" | "reavaliacao" | "alta";

/**
 * As cores aqui são só um fio na lateral do cartão, não uma legenda.
 * O mostarda de "reavaliação" vinha de fora da identidade e puxava o olho
 * mais que o próprio conteúdo — agora as quatro são variações do verde e do
 * terracota da marca.
 */
export const TIPOS_SESSAO: { valor: TipoSessao; rotulo: string; cor: string }[] = [
  { valor: "avaliacao_inicial", rotulo: "Avaliação inicial", cor: "var(--cor-acento)" },
  { valor: "tratamento", rotulo: "Sessão de tratamento", cor: "var(--cor-primaria)" },
  { valor: "reavaliacao", rotulo: "Reavaliação", cor: "#4f8a7f" },
  { valor: "alta", rotulo: "Alta", cor: "#3a7a4e" },
];

export function rotuloTipoSessao(tipo: string | null | undefined): string {
  return TIPOS_SESSAO.find((t) => t.valor === tipo)?.rotulo ?? "Sessão de tratamento";
}

export function corTipoSessao(tipo: string | null | undefined): string {
  return TIPOS_SESSAO.find((t) => t.valor === tipo)?.cor ?? "var(--cor-primaria)";
}
