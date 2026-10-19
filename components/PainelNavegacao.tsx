"use client";

import { useState } from "react";
import styles from "./painelNavegacao.module.css";

export type AbaPainel = {
  id: string;
  rotulo: string;
  conteudo: React.ReactNode;
  /** Quantidade de itens esperando ação. Zero ou ausente não mostra nada. */
  pendencias?: number;
};

export type GrupoPainel = {
  id: string;
  rotulo: string;
  icone: React.ReactNode;
  /** Ids de abas deste grupo, na ordem em que aparecem. */
  abas: string[];
};

/**
 * Navegação do painel em dois níveis.
 *
 * Com nove abas numa fileira só, a barra rolava na horizontal — e rolar a
 * barra pro lado enquanto a página rola pra cima e pra baixo deixava a lista
 * "flutuando", além de esconder metade do painel fora da tela. Agora os
 * grupos cabem sem rolagem nenhuma, e cada um abre suas próprias abas.
 *
 * As abas continuam todas renderizadas e apenas escondidas (como antes): o
 * conteúdo vem pronto do servidor numa carga só, então trocar de aba é
 * instantâneo e não refaz consulta nenhuma.
 */
export function PainelNavegacao({
  grupos,
  abas,
  inicial,
}: {
  grupos: GrupoPainel[];
  abas: AbaPainel[];
  inicial?: string;
}) {
  const abaValida = inicial && abas.some((a) => a.id === inicial) ? inicial : abas[0]?.id;
  const [ativa, setAtiva] = useState(abaValida);

  const grupoDaAba = (id?: string) => grupos.find((g) => g.abas.includes(id ?? ""))?.id ?? grupos[0]?.id;
  const [grupoAtivo, setGrupoAtivo] = useState(() => grupoDaAba(abaValida));

  const grupo = grupos.find((g) => g.id === grupoAtivo) ?? grupos[0];
  const abasDoGrupo = grupo.abas.map((id) => abas.find((a) => a.id === id)).filter(Boolean) as AbaPainel[];

  /** Pendências de um grupo = soma das abas dele, pra não esconder aviso em subaba fechada. */
  function pendenciasDoGrupo(g: GrupoPainel) {
    return g.abas.reduce((total, id) => total + (abas.find((a) => a.id === id)?.pendencias ?? 0), 0);
  }

  function trocarGrupo(g: GrupoPainel) {
    setGrupoAtivo(g.id);
    // Entra na primeira subaba do grupo, a não ser que a aba atual já seja dele.
    if (!g.abas.includes(ativa ?? "")) setAtiva(g.abas[0]);
  }

  return (
    <div>
      <div className={styles.barraGrupos} role="tablist" aria-label="Áreas do painel">
        {grupos.map((g) => {
          const selecionado = g.id === grupo.id;
          const pendencias = pendenciasDoGrupo(g);
          return (
            <button
              key={g.id}
              role="tab"
              aria-selected={selecionado}
              onClick={() => trocarGrupo(g)}
              className={`${styles.grupo} ${selecionado ? styles.grupoAtivo : ""}`}
            >
              <span className={styles.grupoIcone}>
                {g.icone}
                {pendencias > 0 && (
                  <span className={styles.pontoPendencia} aria-label={`${pendencias} aguardando você`} />
                )}
              </span>
              <span className={styles.grupoRotulo}>{g.rotulo}</span>
            </button>
          );
        })}
      </div>

      {abasDoGrupo.length > 1 && (
        <div className={styles.barraAbas} role="tablist" aria-label={grupo.rotulo}>
          {abasDoGrupo.map((a) => {
            const selecionada = a.id === ativa;
            return (
              <button
                key={a.id}
                role="tab"
                aria-selected={selecionada}
                onClick={() => setAtiva(a.id)}
                className={`${styles.aba} ${selecionada ? styles.abaAtiva : ""}`}
              >
                {a.rotulo}
                {!!a.pendencias && a.pendencias > 0 && (
                  <span className={styles.selo}>{a.pendencias > 99 ? "99+" : a.pendencias}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {abas.map((a) => (
        <div key={a.id} hidden={a.id !== ativa}>
          {a.conteudo}
        </div>
      ))}
    </div>
  );
}
