/**
 * Nome e rosto da assistente, separados do conteúdo da FAQ de propósito.
 *
 * A bolha flutuante aparece em toda visita e precisa só disto; o resto
 * (lib/assistente.ts, com todas as perguntas e respostas) só é baixado quando
 * alguém abre o painel. Juntar os dois num arquivo só colocaria ~7 kB de texto
 * no carregamento inicial de /inicio e /exercicios à toa.
 */
export const ASSISTENTE_IDENTIDADE = {
  /** Deliberadamente diferente de "Beatriz" pra ninguém achar que fala com a fisioterapeuta. */
  nome: "Lia",
  papel: "assistente do app",
  avatar: "/marca/assistente-avatar.png",
} as const;
