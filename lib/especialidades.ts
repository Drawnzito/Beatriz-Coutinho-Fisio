export type Especialidade = "traumatologia" | "osteopatia" | "liberacao_miofascial" | "pelvica";

export const ESPECIALIDADES: { valor: Especialidade; rotulo: string }[] = [
  { valor: "traumatologia", rotulo: "Traumatologia" },
  { valor: "osteopatia", rotulo: "Osteopatia" },
  { valor: "liberacao_miofascial", rotulo: "Liberação miofascial" },
  { valor: "pelvica", rotulo: "Fisioterapia pélvica" },
];

export function rotuloEspecialidade(valor: string | null | undefined): string | null {
  return ESPECIALIDADES.find((e) => e.valor === valor)?.rotulo ?? null;
}

export const MODALIDADES_PELVICA: { valor: "domiciliar" | "presencial"; rotulo: string }[] = [
  { valor: "presencial", rotulo: "Presencial na clínica" },
  { valor: "domiciliar", rotulo: "Domiciliar" },
];

export function rotuloModalidade(valor: string | null | undefined): string | null {
  return MODALIDADES_PELVICA.find((m) => m.valor === valor)?.rotulo ?? null;
}
