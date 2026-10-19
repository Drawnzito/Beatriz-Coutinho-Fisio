import { CLINICA } from "./clinica";
import { ASSISTENTE_IDENTIDADE } from "./assistenteIdentidade";

/**
 * Conteúdo da assistente do app.
 *
 * É uma FAQ guiada, não um chat de verdade: a paciente escolhe entre
 * perguntas prontas e a resposta já está escrita aqui. Essa foi a decisão
 * explícita do projeto — nenhuma chamada a serviço de IA, custo zero e
 * nenhuma chance de inventar uma informação clínica errada.
 *
 * Pra mudar o que ela responde, mexa só neste arquivo: o componente
 * (components/Assistente.tsx) não tem texto nenhum escrito dentro dele.
 */

export const ASSISTENTE = {
  ...ASSISTENTE_IDENTIDADE,
  saudacao:
    `Oi! Eu sou a ${ASSISTENTE_IDENTIDADE.nome}, a assistente deste aplicativo. ` +
    "Respondo as dúvidas mais comuns na hora — é tudo automático, não sou a Beatriz. " +
    "Escolhe uma pergunta aí embaixo:",
  rodape: "Não achou o que queria? A Beatriz responde pelo WhatsApp.",
} as const;

export type AcaoAssistente =
  | { tipo: "tour" }
  | { tipo: "whatsapp"; rotulo: string }
  | { tipo: "link"; rotulo: string; href: string; externo?: boolean };

export type PerguntaAssistente = {
  id: string;
  /** Texto do botão — escrito do jeito que a paciente perguntaria. */
  pergunta: string;
  /** Resposta. Parágrafos separados por linha em branco. */
  resposta: string;
  acao?: AcaoAssistente;
  /** Perguntas sugeridas logo depois desta. */
  seguintes?: string[];
};

export const PERGUNTAS: PerguntaAssistente[] = [
  // ---------- Sessões ----------
  {
    id: "marcar-sessao",
    pergunta: "Como marco uma sessão?",
    resposta:
      "Na tela de Início, toque em “Solicitar nova sessão”. Você escolhe o dia, " +
      "um horário entre os que estão livres e a especialidade.\n\n" +
      "O pedido chega pra Beatriz e fica como “solicitada” até ela aprovar. " +
      "Quando ela responder, a sessão aparece na sua agenda já confirmada.",
    acao: { tipo: "link", rotulo: "Ir pra agenda", href: "/inicio" },
    seguintes: ["horario-ocupado", "quanto-tempo-aprovar", "desmarcar"],
  },
  {
    id: "horario-ocupado",
    pergunta: "Por que alguns horários não aparecem?",
    resposta:
      "A grade mostra só os horários em que a Beatriz atende. Os que já estão " +
      "ocupados aparecem riscados, e os que ela bloqueou (férias, compromisso, " +
      "intervalo) não aparecem pra escolher.\n\n" +
      "Horário em amarelo é um que outra paciente já pediu, mas ainda não foi " +
      "aprovado — você pode pedir também, e a Beatriz decide.",
    seguintes: ["marcar-sessao", "falar-beatriz"],
  },
  {
    id: "quanto-tempo-aprovar",
    pergunta: "Pedi uma sessão. E agora?",
    resposta:
      "Agora é esperar a Beatriz aprovar. Enquanto isso o cartão fica marcado " +
      "como “solicitada” na sua agenda.\n\n" +
      "Você recebe um e-mail assim que ela responder, aprovando ou não. " +
      "Se for urgente, falar no WhatsApp é mais rápido.",
    acao: { tipo: "whatsapp", rotulo: "Falar no WhatsApp" },
    seguintes: ["desmarcar", "confirmar-presenca"],
  },
  {
    id: "confirmar-presenca",
    pergunta: "O que é confirmar presença?",
    resposta:
      "Nos cartões das suas próximas sessões aparecem os botões de confirmar " +
      "ou avisar que não vai dar.\n\n" +
      "Confirmar ajuda a Beatriz a organizar o dia — e avisar com antecedência " +
      "libera o horário pra outra paciente. Dizer o motivo é opcional.",
    seguintes: ["desmarcar", "marcar-sessao"],
  },
  {
    id: "desmarcar",
    pergunta: "Preciso desmarcar. Como faço?",
    resposta:
      "No cartão da sessão, toque em avisar que não vai poder ir — dá pra " +
      "escolher um motivo ou escrever um.\n\n" +
      "Se for em cima da hora, mande também uma mensagem no WhatsApp pra ela " +
      "ver a tempo.",
    acao: { tipo: "whatsapp", rotulo: "Falar no WhatsApp" },
    seguintes: ["marcar-sessao", "falar-beatriz"],
  },

  // ---------- Exercícios ----------
  {
    id: "meus-exercicios",
    pergunta: "Onde vejo os meus exercícios?",
    resposta:
      "Na aba Exercícios, lá embaixo. Cada treino que a Beatriz montou pra você " +
      "fica num bloco, com os exercícios, as séries e as repetições.\n\n" +
      "Toque em “Iniciar treino” pra fazer um de cada vez, com a demonstração " +
      "na tela.",
    acao: { tipo: "link", rotulo: "Abrir meus exercícios", href: "/exercicios" },
    seguintes: ["video-nao-abre", "treino-antigo", "quantas-vezes"],
  },
  {
    id: "quantas-vezes",
    pergunta: "Quantas vezes devo fazer o treino?",
    resposta:
      "Isso é a Beatriz quem define pra cada caso — as séries e repetições de " +
      "cada exercício estão escritas no seu plano.\n\n" +
      "Se ficou dúvida sobre a frequência, ou se algum movimento está doendo, " +
      "fale com ela antes de continuar. Eu não posso orientar tratamento.",
    acao: { tipo: "whatsapp", rotulo: "Falar no WhatsApp" },
    seguintes: ["meus-exercicios", "falar-beatriz"],
  },
  {
    id: "video-nao-abre",
    pergunta: "O vídeo ou gif não carrega",
    resposta:
      "Quase sempre é a internet do celular. Tente: fechar e abrir o app de " +
      "novo, ou trocar do 4G pro Wi-Fi.\n\n" +
      "Se continuar sem aparecer só naquele exercício, avise a Beatriz — pode " +
      "ser o arquivo daquele exercício específico.",
    acao: { tipo: "whatsapp", rotulo: "Avisar no WhatsApp" },
    seguintes: ["meus-exercicios"],
  },
  {
    id: "treino-antigo",
    pergunta: "Sumiu um treino que eu fazia",
    resposta:
      "Quando a Beatriz monta um plano novo, o anterior sai da lista principal " +
      "pra não confundir — mas ele não é apagado.\n\n" +
      "Ele fica em “Treinos anteriores”, no fim da aba Exercícios, só pra " +
      "consulta.",
    acao: { tipo: "link", rotulo: "Abrir meus exercícios", href: "/exercicios" },
    seguintes: ["meus-exercicios"],
  },

  // ---------- Clínica ----------
  {
    id: "onde-fica",
    pergunta: "Onde fica o consultório?",
    resposta: `${CLINICA.local}.\n\n${CLINICA.endereco}.`,
    acao: { tipo: "link", rotulo: "Ver no mapa", href: CLINICA.mapaUrl, externo: true },
    seguintes: ["falar-beatriz", "atende-casa"],
  },
  {
    id: "atende-casa",
    pergunta: "Tem atendimento em casa?",
    resposta:
      "Sim, para fisioterapia pélvica — ao pedir a sessão você escolhe entre " +
      "domiciliar e presencial.\n\n" +
      "As outras especialidades são no consultório.",
    seguintes: ["especialidades", "marcar-sessao"],
  },
  {
    id: "especialidades",
    pergunta: "O que a Beatriz trata?",
    resposta:
      "Fisioterapia pélvica, traumatologia, osteopatia e liberação miofascial.\n\n" +
      "Na página de apresentação tem uma explicação de cada uma.",
    acao: { tipo: "link", rotulo: "Ver as especialidades", href: "/" },
    seguintes: ["atende-casa", "falar-beatriz"],
  },
  {
    id: "falar-beatriz",
    pergunta: "Quero falar com a Beatriz",
    resposta:
      "Claro — valores, convênio, dúvida sobre o seu tratamento e qualquer " +
      "coisa que eu não saiba responder é direto com ela.\n\n" +
      "O WhatsApp e o endereço também ficam na aba Perfil, no fim.",
    acao: { tipo: "whatsapp", rotulo: "Falar no WhatsApp" },
    seguintes: ["onde-fica", "primeiros-passos"],
  },

  // ---------- App e conta ----------
  {
    id: "primeiros-passos",
    pergunta: "Me mostra como usar o app",
    resposta:
      "Vou te levar por um passo a passo rápido pela tela, destacando cada " +
      "parte. Dura menos de um minuto.",
    acao: { tipo: "tour" },
    seguintes: ["meus-exercicios", "marcar-sessao"],
  },
  {
    id: "meus-dados",
    pergunta: "Como mudo os meus dados?",
    resposta:
      "Na aba Perfil você edita o seu WhatsApp e vê os dados da sua conta.\n\n" +
      "Nome e e-mail vêm da conta Google que você usa pra entrar — pra trocar " +
      "esses, é na conta Google.",
    acao: { tipo: "link", rotulo: "Abrir meu perfil", href: "/perfil" },
    seguintes: ["privacidade", "avaliar"],
  },
  {
    id: "indicar",
    pergunta: "Posso indicar uma amiga?",
    resposta:
      "Pode, e é bem-vindo! Na aba Perfil tem “Indique uma amiga”: você deixa " +
      "o nome e o contato dela.\n\n" +
      "A Beatriz entra em contato e aplica o desconto combinado quando ela " +
      "marcar a primeira sessão.",
    acao: { tipo: "link", rotulo: "Indicar agora", href: "/perfil" },
    seguintes: ["avaliar", "falar-beatriz"],
  },
  {
    id: "avaliar",
    pergunta: "Como avalio o atendimento?",
    resposta:
      "Depois de cada sessão realizada aparece “Avaliar atendimento” no cartão " +
      "dela, na tela de Início.\n\n" +
      "E se quiser falar do aplicativo em si, tem uma avaliação separada na aba " +
      "Perfil — pode mandar quantas vezes quiser.",
    acao: { tipo: "link", rotulo: "Abrir meu perfil", href: "/perfil" },
    seguintes: ["indicar", "meus-dados"],
  },
  {
    id: "privacidade",
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Sim. O que você registra aqui é visto só por você e pela Beatriz, e as " +
      "anotações clínicas dela não ficam visíveis pra mais ninguém.\n\n" +
      "A política de privacidade explica em detalhe o que é guardado e por quê.",
    acao: { tipo: "link", rotulo: "Ler a política", href: "/politica-de-privacidade" },
    seguintes: ["meus-dados", "falar-beatriz"],
  },
];

/** Perguntas mostradas de cara, antes de a paciente escolher qualquer coisa. */
export const PERGUNTAS_INICIAIS = [
  "marcar-sessao",
  "meus-exercicios",
  "onde-fica",
  "primeiros-passos",
  "falar-beatriz",
];

/** Agrupamento usado no "ver todas as perguntas". */
export const GRUPOS_ASSISTENTE: { titulo: string; ids: string[] }[] = [
  {
    titulo: "Sessões",
    ids: ["marcar-sessao", "horario-ocupado", "quanto-tempo-aprovar", "confirmar-presenca", "desmarcar"],
  },
  {
    titulo: "Exercícios",
    ids: ["meus-exercicios", "quantas-vezes", "video-nao-abre", "treino-antigo"],
  },
  {
    titulo: "Atendimento",
    ids: ["onde-fica", "atende-casa", "especialidades", "falar-beatriz"],
  },
  {
    titulo: "App e conta",
    ids: ["primeiros-passos", "meus-dados", "indicar", "avaliar", "privacidade"],
  },
];

export function acharPergunta(id: string): PerguntaAssistente | undefined {
  return PERGUNTAS.find((p) => p.id === id);
}
