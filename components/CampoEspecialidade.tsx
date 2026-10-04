"use client";

import { useState } from "react";
import { ESPECIALIDADES, MODALIDADES_PELVICA } from "@/lib/especialidades";

export function CampoEspecialidade({
  style,
  obrigatorio = true,
}: {
  style?: React.CSSProperties;
  obrigatorio?: boolean;
}) {
  const [especialidade, setEspecialidade] = useState("");

  return (
    <>
      <select
        name="especialidade"
        value={especialidade}
        onChange={(e) => setEspecialidade(e.target.value)}
        required={obrigatorio}
        style={style}
      >
        <option value="">Selecione a especialidade</option>
        {ESPECIALIDADES.map((e) => (
          <option key={e.valor} value={e.valor}>
            {e.rotulo}
          </option>
        ))}
      </select>
      {especialidade === "pelvica" && (
        <select name="modalidade" defaultValue="presencial" style={style}>
          {MODALIDADES_PELVICA.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.rotulo}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
