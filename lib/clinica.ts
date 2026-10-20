/**
 * Dados institucionais da clínica.
 *
 * Ficavam fixos dentro de components/InfoContatoClinica. Saíram de lá porque
 * agora a página pública, o blog e os metadados de compartilhamento precisam
 * das mesmas informações — e endereço divergente entre telas é o tipo de erro
 * que ninguém percebe até uma paciente ir no lugar errado.
 */

export const CLINICA = {
  nome: "Beatriz Coutinho Fisioterapia",
  profissional: "Beatriz Coutinho",
  chamada: "Fisioterapia pélvica, osteopatia e reabilitação em Recife",
  descricao:
    "Atendimento individualizado em fisioterapia pélvica, traumatologia, " +
    "osteopatia e liberação miofascial. Plano de exercícios acompanhado pelo " +
    "aplicativo, do consultório até a sua casa.",
  local: "Resilience Saúde Center - Pilates | Osteopatia | Fisioterapia",
  endereco: "R. Cel. João Rufino, 53 - Poço da Panela, Recife - PE, 52061-110",
  cidade: "Recife",
  estado: "PE",
  mapaUrl:
    "https://www.google.com.br/maps/place/Resilience+Sa%C3%BAde+Center+-+Pilates+%7C+Osteopatia+%7C+Fisioterapia/@-8.0313253,-34.9260835,17z/data=!3m1!4b1!4m6!3m5!1s0x7ab19a438b58605:0x175a2ea9490581a0!8m2!3d-8.0313253!4d-34.9235086!16s%2Fg%2F11g8gthr6g",
} as const;

/**
 * Imagem que aparece quando alguém manda o link do site no WhatsApp.
 *
 * Antes era o logo-cartão, que tem 2400x675 — uma tira bem comprida. O
 * WhatsApp encaixa a imagem num quadro pequeno e quase quadrado, então a
 * marca saía minúscula e borrada. Esta é 1200x630 de verdade, com a marca
 * grande o suficiente pra ser lida em miniatura.
 */
export const IMAGEM_COMPARTILHAMENTO = {
  url: "/marca/og-capa.png",
  width: 1200,
  height: 630,
} as const;

/**
 * Endereço do site. Usado nos metadados de compartilhamento e no sitemap,
 * que precisam de URL absoluta. A Vercel preenche VERCEL_URL sozinha nos
 * deploys de prévia; em produção vale o valor fixo.
 */
export function urlDoSite(): string {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL;
  if (configurada) return configurada.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://beatriz-coutinho-fisio.vercel.app";
}

export const ESPECIALIDADES_SITE = [
  {
    valor: "pelvica",
    titulo: "Fisioterapia pélvica",
    texto:
      "Avaliação e tratamento do assoalho pélvico: incontinência, dor pélvica, " +
      "pré e pós-parto. Disponível na clínica ou em atendimento domiciliar.",
  },
  {
    valor: "traumatologia",
    titulo: "Traumatologia",
    texto:
      "Reabilitação de lesões articulares, musculares e pós-operatórias, com " +
      "progressão acompanhada sessão a sessão.",
  },
  {
    valor: "osteopatia",
    titulo: "Osteopatia",
    texto:
      "Abordagem manual que trata a causa da dor, e não só o sintoma, " +
      "considerando o corpo como um conjunto.",
  },
  {
    valor: "liberacao_miofascial",
    titulo: "Liberação miofascial",
    texto:
      "Técnicas manuais para soltar tensões da fáscia, devolver mobilidade e " +
      "aliviar dores que persistem.",
  },
] as const;
