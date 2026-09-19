import { agoraBrasil, paraIsoBrasil } from "./dataBrasil";

const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type DiaSemana = {
  iso: string;
  numero: number;
  abreviacao: string;
  hoje: boolean;
};

export function semanaAtual(referenciaBrasil: Date = agoraBrasil()): DiaSemana[] {
  const hojeIso = paraIsoBrasil(referenciaBrasil);
  const diaSemana = referenciaBrasil.getUTCDay();
  const domingo = new Date(referenciaBrasil);
  domingo.setUTCDate(referenciaBrasil.getUTCDate() - diaSemana);

  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(domingo);
    data.setUTCDate(domingo.getUTCDate() + i);
    const iso = paraIsoBrasil(data);
    return {
      iso,
      numero: data.getUTCDate(),
      abreviacao: DIAS_ABREV[i],
      hoje: iso === hojeIso,
    };
  });
}
