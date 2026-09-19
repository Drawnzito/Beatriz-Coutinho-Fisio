import { agoraBrasil, paraIsoBrasil } from "./dataBrasil";

const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_COMPLETOS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export type DiaSemana = {
  iso: string;
  numero: number;
  abreviacao: string;
  nomeCompleto: string;
  hoje: boolean;
};

export function semanaAtual(offsetSemanas: number = 0): DiaSemana[] {
  const agora = agoraBrasil();
  const hojeIso = paraIsoBrasil(agora);
  const referencia = new Date(agora.getTime() + offsetSemanas * 7 * 24 * 60 * 60 * 1000);
  const diaSemana = referencia.getUTCDay();
  const domingo = new Date(referencia);
  domingo.setUTCDate(referencia.getUTCDate() - diaSemana);

  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(domingo);
    data.setUTCDate(domingo.getUTCDate() + i);
    const iso = paraIsoBrasil(data);
    return {
      iso,
      numero: data.getUTCDate(),
      abreviacao: DIAS_ABREV[i],
      nomeCompleto: DIAS_COMPLETOS[i],
      hoje: iso === hojeIso,
    };
  });
}
