"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const CHAVE = "painel:posicao";

/**
 * Devolve a rolagem ao lugar depois de salvar algo.
 *
 * Toda ação do painel termina num `redirect` do servidor, e redirecionar é
 * uma navegação nova — o navegador joga a página pro topo. Quem estava
 * editando o décimo exercício da lista se perdia a cada "salvar".
 *
 * Em vez de mexer nas ~20 ações, isto escuta o envio de QUALQUER formulário
 * da página, guarda a posição e restaura quando a resposta chega (sinalizada
 * pelo parâmetro `sucesso`, que as ações já colocam na URL).
 */
function Restaurador() {
  const searchParams = useSearchParams();
  const sucesso = searchParams.get("sucesso");

  useEffect(() => {
    function aoEnviar() {
      try {
        sessionStorage.setItem(CHAVE, String(window.scrollY));
      } catch {
        // navegação privada / armazenamento bloqueado: sem isso só perdemos
        // a comodidade, nada quebra
      }
    }

    // Fase de captura: pega o submit antes de qualquer handler cancelar.
    document.addEventListener("submit", aoEnviar, true);
    return () => document.removeEventListener("submit", aoEnviar, true);
  }, []);

  useEffect(() => {
    if (!sucesso) return;

    let salvo: string | null = null;
    try {
      salvo = sessionStorage.getItem(CHAVE);
      sessionStorage.removeItem(CHAVE);
    } catch {
      return;
    }

    if (!salvo) return;
    const posicao = parseInt(salvo, 10);
    if (Number.isNaN(posicao)) return;

    // Um quadro de espera: o conteúdo precisa estar montado, senão a página
    // ainda não tem altura suficiente pra rolar até lá.
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: posicao, behavior: "auto" });
    });
    return () => cancelAnimationFrame(id);
  }, [sucesso]);

  return null;
}

export function MantemPosicao() {
  return (
    <Suspense fallback={null}>
      <Restaurador />
    </Suspense>
  );
}
