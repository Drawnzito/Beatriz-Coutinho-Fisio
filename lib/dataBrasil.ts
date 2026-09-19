/**
 * O servidor (Vercel) roda em UTC, não no horário de Brasília — sem
 * corrigir isso, "hoje" no servidor vira amanhã a partir de ~21h no
 * Brasil (e volta ao normal de madrugada), bagunçando qualquer
 * cálculo de "hoje"/"essa semana". Brasil não tem mais horário de
 * verão desde 2019, então UTC-3 fixo é seguro o ano inteiro.
 */

const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;

export function agoraBrasil(): Date {
  return new Date(Date.now() - OFFSET_BRASIL_MS);
}

export function paraIsoBrasil(dataDeslocada: Date): string {
  const ano = dataDeslocada.getUTCFullYear();
  const mes = String(dataDeslocada.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(dataDeslocada.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function hojeIsoBrasil(): string {
  return paraIsoBrasil(agoraBrasil());
}
