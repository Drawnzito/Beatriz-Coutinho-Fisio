-- Rode no SQL Editor do Supabase, depois dos scripts anteriores já aplicados.
-- Adiciona: confirmação/recusa de agendamento pelo paciente + arquivamento (alta) de paciente.

-- ==========================================================
-- CONFIRMAÇÃO DE AGENDAMENTO
-- ==========================================================
alter table public.sessoes add column if not exists motivo_recusa text;

-- RPC que o próprio paciente chama pra confirmar/recusar a própria sessão,
-- sem precisar de uma policy genérica de UPDATE pra paciente em sessoes
-- (assim ele só consegue mexer em status/motivo_recusa, nada mais).
create or replace function public.responder_sessao(sessao_id uuid, novo_status text, motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if novo_status not in ('confirmada', 'recusada') then
    raise exception 'status inválido: %', novo_status;
  end if;

  update public.sessoes
  set status = novo_status,
      motivo_recusa = case when novo_status = 'recusada' then motivo else null end
  where id = sessao_id and paciente_id = auth.uid();

  if not found then
    raise exception 'sessão não encontrada ou não pertence a você';
  end if;
end;
$$;

-- ==========================================================
-- ARQUIVAMENTO DE PACIENTE (ALTA)
-- ==========================================================
-- null = paciente ativo. Preenchido = arquivado (data da alta).
-- Ele continua logando e vendo o próprio histórico normalmente —
-- só some das listas/seletores ativos da fisioterapeuta.
alter table public.perfis add column if not exists arquivado_em timestamptz;
