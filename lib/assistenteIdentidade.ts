/**
 * Nome e rosto da assistente, separados do conteúdo da FAQ de propósito.
 *
 * A bolha flutuante aparece em toda visita e precisa só disto; o resto
 * (lib/assistente.ts, com todas as perguntas e respostas) só é baixado quando
 * alguém abre o painel. Juntar os dois num arquivo só colocaria ~7 kB de texto
 * no carregamento inicial de /inicio e /exercicios à toa.
 */
export const ASSISTENTE_IDENTIDADE = {
  nome: "Bia",
  /* O nome é trocadilho com Beatriz, e é de propósito. Em troca, o papel
     aparece embaixo do nome em toda tela e a saudação abre dizendo que é
     automática — ninguém pode achar que está escrevendo pra fisioterapeuta. */
  papel: "assistente virtual",
  avatar: "/marca/assistente-avatar.png",
  /** Balãozinho que ela "fala" sozinha ao lado da bolha, uma vez por visita. */
  chamada: "Oi! Eu sou a Bia 👋 Posso ajudar com a agenda, os exercícios ou falar com a Beatriz.",
} as const;
