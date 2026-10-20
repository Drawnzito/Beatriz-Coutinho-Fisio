"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./montarPlano.module.css";

export type ExercicioDisponivel = {
  id: string;
  titulo: string;
  categoria: string | null;
  series_padrao: number | null;
  repeticoes_padrao: number | null;
};

export type ItemDoPlano = {
  exercicio_id: string;
  series: number | null;
  repeticoes: number | null;
};

type Escolhido = {
  id: string;
  series: string;
  repeticoes: string;
};

/**
 * Montar e editar plano de treino.
 *
 * O formulário antigo era uma lista única com TODOS os exercícios da
 * biblioteca em checkbox, cada um com dois campos de número ao lado. Com
 * poucos exercícios funcionava; com a biblioteca crescendo vira uma parede
 * onde não dá pra achar nada nem enxergar o que já foi escolhido — e a ordem
 * do treino era a ordem do cadastro, não a que a Beatriz queria.
 *
 * Agora são duas metades: em cima o treino sendo montado (na ordem certa,
 * com séries e repetições de cada um), embaixo a biblioteca com busca e
 * agrupada por categoria.
 */
export function MontarPlano({
  exercicios,
  pacientes,
  acao,
  tituloInicial = "",
  itensIniciais = [],
  rotuloBotao,
  cancelarHref,
}: {
  exercicios: ExercicioDisponivel[];
  /** Só na criação: ao editar, o plano já tem dono. */
  pacientes?: { id: string; nome: string | null; email: string }[];
  acao: (formData: FormData) => void;
  tituloInicial?: string;
  itensIniciais?: ItemDoPlano[];
  rotuloBotao: string;
  cancelarHref?: string;
}) {
  const [escolhidos, setEscolhidos] = useState<Escolhido[]>(() =>
    itensIniciais.map((i) => ({
      id: i.exercicio_id,
      series: i.series != null ? String(i.series) : "",
      repeticoes: i.repeticoes != null ? String(i.repeticoes) : "",
    }))
  );
  const [busca, setBusca] = useState("");

  const porId = useMemo(() => new Map(exercicios.map((e) => [e.id, e])), [exercicios]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = termo
      ? exercicios.filter((e) => e.titulo.toLowerCase().includes(termo) || (e.categoria ?? "").toLowerCase().includes(termo))
      : exercicios;

    const mapa = new Map<string, ExercicioDisponivel[]>();
    for (const ex of filtrados) {
      const chave = (ex.categoria || "sem categoria").trim().toLowerCase();
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(ex);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [exercicios, busca]);

  function alternar(id: string) {
    setEscolhidos((atuais) =>
      atuais.some((e) => e.id === id)
        ? atuais.filter((e) => e.id !== id)
        : [...atuais, { id, series: "", repeticoes: "" }]
    );
  }

  function mover(indice: number, passo: number) {
    setEscolhidos((atuais) => {
      const destino = indice + passo;
      if (destino < 0 || destino >= atuais.length) return atuais;
      const copia = [...atuais];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function mudarCampo(id: string, campo: "series" | "repeticoes", valor: string) {
    setEscolhidos((atuais) => atuais.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));
  }

  return (
    <form action={acao} className={styles.form}>
      {pacientes && (
        <select name="paciente_id" required className={styles.campo}>
          <option value="">Selecione o paciente</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome || p.email}
            </option>
          ))}
        </select>
      )}

      <input
        name="titulo"
        placeholder="Nome do treino (ex: Treino A)"
        defaultValue={tituloInicial}
        required
        className={styles.campo}
      />

      {/* ---------- O treino sendo montado ---------- */}
      <div className={styles.painelEscolhidos}>
        <p className={styles.tituloBloco}>
          No treino
          <span className={styles.contagem}>{escolhidos.length}</span>
        </p>

        {escolhidos.length === 0 ? (
          <p className={styles.vazio}>
            Nenhum exercício ainda. Escolha abaixo — eles aparecem aqui na ordem em que a paciente vai fazer.
          </p>
        ) : (
          <ol className={styles.listaEscolhidos}>
            {escolhidos.map((escolhido, i) => {
              const ex = porId.get(escolhido.id);
              if (!ex) return null;
              return (
                <li key={escolhido.id} className={styles.itemEscolhido}>
                  {/* A ordem do envio é a ordem destes campos: a action numera
                      os exercícios pela sequência em que chegam. */}
                  <input type="hidden" name="exercicio_id" value={escolhido.id} />

                  <span className={styles.posicao}>{i + 1}</span>

                  <span className={styles.nomeEscolhido}>{ex.titulo}</span>

                  <span className={styles.camposNumero}>
                    <input
                      name={`series_${escolhido.id}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={escolhido.series}
                      onChange={(e) => mudarCampo(escolhido.id, "series", e.target.value)}
                      placeholder={ex.series_padrao ? String(ex.series_padrao) : "séries"}
                      aria-label={`Séries de ${ex.titulo}`}
                      className={styles.campoNumero}
                    />
                    <span className={styles.vezes}>×</span>
                    <input
                      name={`repeticoes_${escolhido.id}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={escolhido.repeticoes}
                      onChange={(e) => mudarCampo(escolhido.id, "repeticoes", e.target.value)}
                      placeholder={ex.repeticoes_padrao ? String(ex.repeticoes_padrao) : "reps"}
                      aria-label={`Repetições de ${ex.titulo}`}
                      className={styles.campoNumero}
                    />
                  </span>

                  <span className={styles.acoesItem}>
                    <button
                      type="button"
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label="Subir"
                      className={styles.botaoIcone}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, 1)}
                      disabled={i === escolhidos.length - 1}
                      aria-label="Descer"
                      className={styles.botaoIcone}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => alternar(escolhido.id)}
                      aria-label={`Tirar ${ex.titulo} do treino`}
                      className={styles.botaoIcone}
                    >
                      ×
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {escolhidos.length > 0 && (
          <p className={styles.dica}>Séries e repetições em branco usam o padrão cadastrado no exercício.</p>
        )}
      </div>

      {/* ---------- A biblioteca ---------- */}
      <div className={styles.painelBiblioteca}>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar exercício ou categoria…"
          aria-label="Buscar exercício"
          className={styles.campo}
        />

        {grupos.length === 0 && <p className={styles.vazio}>Nenhum exercício encontrado.</p>}

        {grupos.map(([categoria, lista], indice) => (
          // Com busca ativa tudo abre, senão só o primeiro grupo.
          <details key={categoria} open={Boolean(busca) || indice === 0} className={styles.grupo}>
            <summary className={styles.grupoCabecalho}>
              <span className={styles.grupoNome}>{categoria}</span>
              <span className={styles.grupoContagem}>{lista.length}</span>
            </summary>

            <div className={styles.grupoItens}>
              {lista.map((ex) => {
                const marcado = escolhidos.some((e) => e.id === ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => alternar(ex.id)}
                    aria-pressed={marcado}
                    className={`${styles.opcao} ${marcado ? styles.opcaoMarcada : ""}`}
                  >
                    <span className={styles.marca} aria-hidden="true">
                      {marcado ? "✓" : "+"}
                    </span>
                    {ex.titulo}
                  </button>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      <div className={styles.rodape}>
        <button type="submit" className={styles.botaoPrimario} disabled={escolhidos.length === 0}>
          {rotuloBotao}
        </button>
        {cancelarHref && (
          <Link href={cancelarHref} className={styles.cancelar}>
            cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
