const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type DiaSemana = {
  iso: string;
  numero: number;
  abreviacao: string;
  hoje: boolean;
};

function paraIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function semanaAtual(referencia: Date = new Date()): DiaSemana[] {
  const hojeIso = paraIso(referencia);
  const domingo = new Date(referencia);
  domingo.setDate(referencia.getDate() - referencia.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(domingo);
    data.setDate(domingo.getDate() + i);
    const iso = paraIso(data);
    return {
      iso,
      numero: data.getDate(),
      abreviacao: DIAS_ABREV[i],
      hoje: iso === hojeIso,
    };
  });
}
