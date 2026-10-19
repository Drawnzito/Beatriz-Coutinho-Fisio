/**
 * Ids das abas do painel.
 *
 * Existe porque as ações redirecionam pra `/dashboard?aba=<id>` passando o id
 * como texto solto, e um id que não existe não dá erro nenhum: o painel
 * simplesmente abre a primeira aba da lista. Foi o que aconteceu com
 * `removerPlano`, que mandava pra "planos" (plural) e jogava a Beatriz na
 * Biblioteca depois de remover um plano. Tipado assim, um nome errado para o
 * build.
 */
export const ABAS_PAINEL = [
  "agenda",
  "pacientes",
  "indicacoes",
  "avaliacoes",
  "plano",
  "biblioteca",
  "destaques",
  "avisos",
  "blog",
] as const;

export type AbaPainelId = (typeof ABAS_PAINEL)[number];
