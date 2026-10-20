"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MarcaCarregando } from "./MarcaCarregando";
import styles from "./indicadorSalvando.module.css";

/** Trava de segurança: se a ação não devolver nada, o selo não fica pra sempre. */
const TEMPO_MAXIMO_MS = 12000;

/**
 * Selo de "salvando" enquanto um formulário está em voo.
 *
 * Salvar no app é Server Action: o navegador não troca de página, então
 * entre o toque no botão e a tela voltar com o resultado não acontecia nada
 * na tela — em conexão ruim dava pra achar que o toque não pegou e salvar
 * duas vezes.
 *
 * Escuta o submit na fase de captura, em vez de mexer em cada um dos
 * ~30 formulários do painel, e some sozinho quando a rota ou os parâmetros
 * mudam — que é como toda ação daqui termina (as actions redirecionam com
 * `?sucesso=`).
 */
export function IndicadorSalvando() {
  const [ativo, setAtivo] = useState(false);
  const caminho = usePathname();
  const parametros = useSearchParams();

  useEffect(() => {
    function aoEnviar(evento: Event) {
      const formulario = evento.target;
      if (!(formulario instanceof HTMLFormElement)) return;

      // Formulário de busca (method="get") navega sozinho e já tem o
      // esqueleto da troca de tela; o selo aqui só atrapalharia.
      if ((formulario.method || "").toLowerCase() === "get") return;
      if (formulario.dataset.semIndicador === "1") return;

      setAtivo(true);
    }

    document.addEventListener("submit", aoEnviar, true);
    return () => document.removeEventListener("submit", aoEnviar, true);
  }, []);

  // A resposta chegou e a tela mudou: pode sumir.
  useEffect(() => {
    setAtivo(false);
  }, [caminho, parametros]);

  useEffect(() => {
    if (!ativo) return;
    const trava = setTimeout(() => setAtivo(false), TEMPO_MAXIMO_MS);
    return () => clearTimeout(trava);
  }, [ativo]);

  if (!ativo) return null;

  return (
    <div className={styles.selo} role="status" aria-live="polite">
      <MarcaCarregando tamanho={38} claro />
      <span>Salvando…</span>
    </div>
  );
}
