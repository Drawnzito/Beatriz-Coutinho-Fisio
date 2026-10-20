-- Rode no SQL Editor do Supabase, depois do schema_24_post_exemplo.sql.
--
-- BUG REAL: editar um plano apagava todos os plano_exercicios e inseria os
-- novos em duas chamadas separadas (atualizarPlano em app/dashboard/actions.ts).
-- Entre as duas nao existe transacao: se o insert falhasse — um exercicio
-- apagado da biblioteca nesse meio tempo, uma queda de rede, qualquer erro de
-- constraint — o plano ficava SEM NENHUM exercicio, e a paciente perdia o
-- treino inteiro. O app mostrava o erro, mas o estrago ja estava feito.
--
-- Correcao: uma funcao faz apagar + inserir de uma vez. Funcao plpgsql roda
-- dentro de uma transacao implicita, entao qualquer erro no insert desfaz o
-- delete junto e o plano continua exatamente como estava.
--
-- E security definer com checagem explicita de is_admin() (mesmo padrao do
-- resto do app): a policy "admin gerencia itens de qualquer plano" do
-- schema_03 ja cobriria, mas aqui a recusa vira erro visivel em vez de um
-- delete que simplesmente nao acerta nenhuma linha.

create or replace function public.substituir_itens_plano(plano uuid, itens jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'apenas a fisioterapeuta pode alterar os exercicios de um plano';
  end if;

  -- Plano sem exercicio nenhum nao serve pra paciente: se a lista chegar
  -- vazia, e mais provavel ser erro de envio do que intencao.
  if itens is null or jsonb_array_length(itens) = 0 then
    raise exception 'o treino precisa de ao menos um exercicio';
  end if;

  delete from public.plano_exercicios where plano_id = plano;

  insert into public.plano_exercicios (plano_id, exercicio_id, ordem, series, repeticoes)
  select
    plano,
    (item->>'exercicio_id')::uuid,
    (item->>'ordem')::int,
    nullif(item->>'series', '')::int,
    nullif(item->>'repeticoes', '')::int
  from jsonb_array_elements(itens) as item;
end;
$$;
