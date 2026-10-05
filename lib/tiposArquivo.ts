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

export function extensaoDe(nomeArquivo: string): string {
  return nomeArquivo.split(".").pop()?.toLowerCase() || "";
}

export function inferirContentType(nomeArquivo: string, tipoDetectado?: string): string | undefined {
  if (tipoDetectado) return tipoDetectado;
  return TIPOS_POR_EXTENSAO[extensaoDe(nomeArquivo)];
}

export const EXTENSOES_MIDIA = ["gif", "png", "jpg", "jpeg", "webp", "heic", "mp4", "webm", "mov", "ogg"];
export const EXTENSOES_IMAGEM = ["gif", "png", "jpg", "jpeg", "webp", "heic"];
export const EXTENSOES_PDF = ["pdf"];

/** Teto do bucket no Supabase. Avisamos antes de subir pra nao gastar a conexao a toa. */
export const TAMANHO_MAXIMO_MB = 50;
