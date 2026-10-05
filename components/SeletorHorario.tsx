"use client";

import { useEffect, useState } from "react";
import { buscarVagasDoDia } from "@/app/inicio/actions";
import {
  SITUACOES_SELECIONAVEIS,
  type SituacaoHorario,
  type VagaHorario,
} from "@/lib/disponibilidade";
import { hojeIsoBrasil } from "@/lib/dataBrasil";

type Estado = "ocioso" | "carregando" | "pronto" | "erro";

const ESTILO_SITUACAO: Record<
  SituacaoHorario,
  { fundo: string; borda: string; texto: string; legenda: string }
> = {
  livre: {
    fundo: "var(--cor-superficie)",
    borda: "var(--cor-borda)",
    texto: "var(--cor-texto)",
    legenda: "",
  },
  solicitado: {
    fundo: "#fdf4dd",
    borda: "#d8c276",
    texto: "#8a6d1f",
    legenda: "pedido",
  },
  ocupado: {
    fundo: "var(--cor-fundo)",
    borda: "var(--cor-borda)",
    texto: "#a8b2b0",
    legenda: "ocupado",
  },
  bloqueado: {
    fundo: "var(--cor-fundo)",
    borda: "var(--cor-borda)",
    texto: "#a8b2b0",
    legenda: "fechado",
  },
};

/**
 * Data + grade de horarios reais.
 *
 * Antes era um <input type="time"> livre: o paciente digitava qualquer hora e
 * so descobria o conflito depois de enviar a solicitacao. Agora ele ve as
 * vagas do dia, horario confirmado aparece desabilitado e horario que outra
 * paciente ja pediu aparece em amarelo, ainda selecionavel.
 */
export function SeletorHorario({
  nomeData = "data",
  nomeHora = "hora",
  estiloCampo,
}: {
  nomeData?: string;
  nomeHora?: string;
  estiloCampo?: React.CSSProperties;
}) {
  const [data, setData] = useState("");
  const [vagas, setVagas] = useState<VagaHorario[]>([]);
  const [horaEscolhida, setHoraEscolhida] = useState("");
  const [estado, setEstado] = useState<Estado>("ocioso");

  useEffect(() => {
    if (!data) {
      setVagas([]);
      setEstado("ocioso");
      return;
    }

    let cancelado = false;
    setEstado("carregando");
    setHoraEscolhida("");

    buscarVagasDoDia(data)
      .then((resultado) => {
        if (cancelado) return;
        setVagas(resultado);
        setEstado("pronto");
      })
      .catch(() => {
        if (cancelado) return;
        setEstado("erro");
      });

    return () => {
      cancelado = true;
    };
  }, [data]);

  const temGrade = vagas.length > 0;
  const selecionaveis = vagas.filter((v) => SITUACOES_SELECIONAVEIS.includes(v.situacao));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>
          Dia
        </label>
        <input
          name={nomeData}
          type="date"
          required
          min={hojeIsoBrasil()}
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={estiloCampo}
        />
      </div>

      {/* O que o Server Action le */}
      <input type="hidden" name={nomeHora} value={horaEscolhida} />

      {estado === "carregando" && (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
          Buscando horários…
        </p>
      )}

      {estado === "erro" && (
        <p style={{ margin: 0, fontSize: 12.5, color: "#a2334a" }}>
          Não consegui carregar os horários. Tente escolher o dia de novo.
        </p>
      )}

      {estado === "pronto" && !temGrade && (
        <div style={{ display: "grid", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--cor-texto-suave)" }}>
            Não há atendimento cadastrado nesse dia. Você pode sugerir um horário e a
            Beatriz confirma:
          </p>
          <input
            type="time"
            value={horaEscolhida}
            onChange={(e) => setHoraEscolhida(e.target.value)}
            style={estiloCampo}
          />
        </div>
      )}

      {estado === "pronto" && temGrade && (
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12.5, color: "var(--cor-texto-suave)", fontWeight: 600 }}>
            Horário
          </label>

          {selecionaveis.length === 0 && (
            <p style={{ margin: 0, fontSize: 12.5, color: "#a2334a", fontWeight: 600 }}>
              Nenhum horário livre nesse dia — tente outra data.
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {vagas.map((vaga) => {
              const pode = SITUACOES_SELECIONAVEIS.includes(vaga.situacao);
              const escolhido = vaga.hora === horaEscolhida;
              const estilo = ESTILO_SITUACAO[vaga.situacao];

              return (
                <button
                  key={vaga.hora}
                  type="button"
                  disabled={!pode}
                  onClick={() => setHoraEscolhida(vaga.hora)}
                  title={
                    vaga.situacao === "solicitado"
                      ? "Outra paciente já pediu esse horário, mas ainda não foi aprovado"
                      : vaga.situacao === "ocupado"
                      ? "Horário já confirmado"
                      : vaga.situacao === "bloqueado"
                      ? "A Beatriz bloqueou esse horário"
                      : "Horário disponível"
                  }
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    gap: 1,
                    minWidth: 68,
                    padding: "7px 10px",
                    borderRadius: 9,
                    cursor: pode ? "pointer" : "not-allowed",
                    fontFamily: "var(--fonte-corpo)",
                    background: escolhido ? "var(--cor-primaria)" : estilo.fundo,
                    border: `1px solid ${escolhido ? "var(--cor-primaria)" : estilo.borda}`,
                    color: escolhido ? "#fff" : estilo.texto,
                    textDecoration: vaga.situacao === "ocupado" ? "line-through" : "none",
                    opacity: pode ? 1 : 0.65,
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{vaga.hora}</span>
                  {estilo.legenda && (
                    <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 0.2 }}>
                      {escolhido ? "escolhido" : estilo.legenda}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {horaEscolhida &&
            vagas.find((v) => v.hora === horaEscolhida)?.situacao === "solicitado" && (
              <p style={{ margin: 0, fontSize: 11.5, color: "#8a6d1f" }}>
                Outra paciente já pediu esse horário. A Beatriz decide quem fica com ele.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
