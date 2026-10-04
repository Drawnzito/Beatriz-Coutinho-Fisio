-- Rode no SQL Editor do Supabase, depois do schema_16_avaliacoes_e_guia.sql.

alter table public.sessoes add column if not exists especialidade text;
alter table public.sessoes add column if not exists modalidade text;

-- Atualiza a RPC de solicitacao pra tambem receber especialidade/modalidade.
create or replace function public.solicitar_sessao(
  data_sessao date,
  hora_sessao time,
  tipo_sessao text default 'tratamento',
  observacoes_sessao text default null,
  especialidade_sessao text default null,
  modalidade_sessao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_sessao_id uuid;
begin
  insert into public.sessoes (paciente_id, data, hora, tipo, observacoes, especialidade, modalidade, status, criado_por)
  values (auth.uid(), data_sessao, hora_sessao, tipo_sessao, observacoes_sessao, especialidade_sessao, modalidade_sessao, 'solicitada', auth.uid())
  returning id into nova_sessao_id;

  return nova_sessao_id;
end;
$$;
