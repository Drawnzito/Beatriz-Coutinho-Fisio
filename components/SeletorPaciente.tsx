"use client";

import { useRouter } from "next/navigation";

type Paciente = { id: string; nome: string | null; email: string };

export function SeletorPaciente({
  pacientes,
  selecionado,
  baseHref = "/exercicios",
  manterParams = {},
  placeholder = "Selecione um paciente…",
}: {
  pacientes: Paciente[];
  selecionado?: string;
  baseHref?: string;
  manterParams?: Record<string, string | undefined>;
  placeholder?: string;
}) {
  const router = useRouter();

  function construirHref(pacienteId: string) {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(manterParams)) {
      if (valor) params.set(chave, valor);
    }
    if (pacienteId) params.set("paciente", pacienteId);
    const query = params.toString();
    return query ? `${baseHref}?${query}` : baseHref;
  }

  return (
    <select
      value={selecionado ?? ""}
      onChange={(e) => router.push(construirHref(e.target.value))}
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid var(--cor-borda)",
        fontSize: 14,
        fontFamily: "var(--fonte-corpo)",
        width: "100%",
        background: "var(--cor-superficie)",
        color: "var(--cor-texto)",
      }}
    >
      <option value="">{placeholder}</option>
      {pacientes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome || p.email}
        </option>
      ))}
    </select>
  );
}
