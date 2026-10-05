/**
 * Content-Type por extensao.
 *
 * Existe porque o navegador nem sempre preenche `File.type`: GIFs vindos da
 * galeria do celular costumam chegar com o tipo vazio, e ai o Storage grava o
 * arquivo como binario generico e o <img> nao renderiza nada.
 */
const TIPOS_POR_EXTENSAO: Record<string, string> = {
  gif: "image/gif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogg: "video/ogg",
  pdf: "application/pdf",
};

const EXTENSAO_POR_TIPO: Record<string, string> = Object.fromEntries(
  Object.entries(TIPOS_POR_EXTENSAO).map(([extensao, tipo]) => [tipo, extensao])
);

/**
 * Extensao do arquivo, caindo no MIME quando o nome nao tem ponto.
 *
 * Varios seletores de arquivo do Android entregam o arquivo como "image" ou
 * "video", sem extensao nenhuma - sem esse fallback a validacao rejeitava um
 * arquivo perfeitamente valido.
 */
export function extensaoDe(nomeArquivo: string, tipoDetectado?: string): string {
  const partes = nomeArquivo.split(".");
  if (partes.length > 1) {
    const extensao = partes.pop()?.toLowerCase() || "";
    if (extensao) return extensao;
  }

  if (tipoDetectado && EXTENSAO_POR_TIPO[tipoDetectado]) {
    return EXTENSAO_POR_TIPO[tipoDetectado];
  }

  // Ultimo recurso: "image/jpeg" -> "jpeg", "video/mp4" -> "mp4"
  const sufixo = tipoDetectado?.split("/")[1]?.toLowerCase() || "";
  return sufixo.replace(/[^a-z0-9]/g, "");
}

export function inferirContentType(nomeArquivo: string, tipoDetectado?: string): string | undefined {
  if (tipoDetectado) return tipoDetectado;
  return TIPOS_POR_EXTENSAO[extensaoDe(nomeArquivo, tipoDetectado)];
}

export const EXTENSOES_MIDIA = ["gif", "png", "jpg", "jpeg", "webp", "heic", "mp4", "webm", "mov", "ogg"];
export const EXTENSOES_IMAGEM = ["gif", "png", "jpg", "jpeg", "webp", "heic"];
export const EXTENSOES_PDF = ["pdf"];

/** Teto do bucket no Supabase. Avisamos antes de subir pra nao gastar a conexao a toa. */
export const TAMANHO_MAXIMO_MB = 50;
