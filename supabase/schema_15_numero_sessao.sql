-- Rode no SQL Editor do Supabase, depois do schema_14_solicitacao_sessao.sql.

-- Dado um conjunto de ids de sessao, retorna qual eh o numero (1a, 2a, 3a...)
-- de cada uma dentro do historico daquele paciente (so conta sessoes
-- agendadas/confirmadas, ignora solicitada/rejeitada/recusada).
create or replace function public.numeros_sessao(ids uuid[])
returns table(sessao_id uuid, numero int)
language sql
stable
as $$
  select s.id,
    (
      select count(*)::int from public.sessoes s2
      where s2.paciente_id = s.paciente_id
        and s2.status in ('agendada', 'confirmada')
        and (s2.data, s2.criado_em) <= (s.data, s.criado_em)
    ) as numero
  from public.sessoes s
  where s.id = any(ids);
$$;
