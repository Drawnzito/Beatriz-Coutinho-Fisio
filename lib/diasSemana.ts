/** 0 = domingo, igual ao `extract(dow)` do Postgres e ao `getDay()` do JS. */
export const DIAS_SEMANA: { valor: number; curto: string; longo: string }[] = [
  { valor: 0, curto: "Dom", longo: "Domingo" },
  { valor: 1, curto: "Seg", longo: "Segunda-feira" },
  { valor: 2, curto: "Ter", longo: "Terça-feira" },
  { valor: 3, curto: "Qua", longo: "Quarta-feira" },
  { valor: 4, curto: "Qui", longo: "Quinta-feira" },
  { valor: 5, curto: "Sex", longo: "Sexta-feira" },
  { valor: 6, curto: "Sáb", longo: "Sábado" },
];

export function rotuloDiaSemana(valor: number, formato: "curto" | "longo" = "longo"): string {
  const dia = DIAS_SEMANA.find((d) => d.valor === valor);
  return dia ? dia[formato] : "—";
}
