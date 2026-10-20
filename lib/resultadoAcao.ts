/**
 * Resposta de uma Server Action que não troca de tela.
 *
 * O padrão do painel é redirecionar com `?sucesso=`, e o `Feedback` mostra a
 * mensagem. Nos formulários da paciente que ficam no lugar (avaliação,
 * indicação) não há redirecionamento, e por isso eles mostravam o
 * agradecimento no próprio `onSubmit` — ou seja, antes de o servidor
 * responder e também quando a gravação falhava.
 *
 * Com este formato o formulário lê o resultado de verdade via `useFormState`.
 * `null` é o estado inicial, antes do primeiro envio.
 */
export type ResultadoAcao = { ok: true } | { ok: false; erro: string } | null;
