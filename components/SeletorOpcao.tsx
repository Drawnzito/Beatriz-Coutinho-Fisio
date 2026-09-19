"use client";

import { useRouter } from "next/navigation";

export function SeletorOpcao({
  opcoes,
  selecionado,
  nomeParam,
  baseHref,
  manterParams = {},
  placeholder = "Todos",
}: {
  opcoes: { valor: string; rotulo: string }[];
  selecionado?: string;
  nomeParam: string;
  baseHref: string;
  manterParams?: Record<string, string | undefined>;
  placeholder?: string;
}) {
  const router = useRouter();

  function construirHref(valor: string) {
    const params = new URLSearchParams();
    for (const [chave, v] of Object.entries(manterParams)) {
      if (v) params.set(chave, v);
    }
    if (valor) params.set(nomeParam, valor);
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
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}
