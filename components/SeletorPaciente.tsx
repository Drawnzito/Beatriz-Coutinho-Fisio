"use client";

import { useRouter } from "next/navigation";

type Paciente = { id: string; nome: string | null; email: string };

export function SeletorPaciente({
  pacientes,
  selecionado,
}: {
  pacientes: Paciente[];
  selecionado?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selecionado ?? ""}
      onChange={(e) => {
        const valor = e.target.value;
        router.push(valor ? `/exercicios?paciente=${valor}` : "/exercicios");
      }}
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
      <option value="">Selecione um paciente…</option>
      {pacientes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome || p.email}
        </option>
      ))}
    </select>
  );
}
