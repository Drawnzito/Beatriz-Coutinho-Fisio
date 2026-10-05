import { rotuloEspecialidade, rotuloModalidade } from "@/lib/especialidades";

/**
 * Especialidade da sessao em destaque.
 *
 * Fica acima do plano de proposito: na rotina da clinica, saber QUE tipo de
 * atendimento e aquele pesa mais do que saber qual plano de exercicios esta
 * vinculado. Renderiza nada quando a sessao nao tem especialidade (sessao
 * criada pela fisio pode nao ter).
 */
export function ChipEspecialidade({
  especialidade,
  modalidade,
  tamanho = "normal",
}: {
  especialidade: string | null | undefined;
  modalidade?: string | null;
  tamanho?: "normal" | "pequeno";
}) {
  const rotulo = rotuloEspecialidade(especialidade);
  if (!rotulo) return null;

  const rotuloModal = modalidade ? rotuloModalidade(modalidade) : null;
  const pequeno = tamanho === "pequeno";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pequeno ? "2px 8px" : "4px 11px",
        borderRadius: 999,
        background: "var(--cor-acento-suave)",
        color: "var(--cor-acento)",
        fontSize: pequeno ? 11 : 12.5,
        fontWeight: 700,
        lineHeight: 1.4,
      }}
    >
      {rotulo}
      {rotuloModal && (
        <span style={{ fontWeight: 600, opacity: 0.75 }}>· {rotuloModal}</span>
      )}
    </span>
  );
}
