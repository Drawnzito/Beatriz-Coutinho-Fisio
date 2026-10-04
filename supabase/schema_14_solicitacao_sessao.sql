-- Rode no SQL Editor do Supabase, depois do schema_13_contato_whatsapp.sql.

-- ==========================================================
-- SOLICITACAO DE SESSAO PELO PACIENTE
-- ==========================================================
-- O paciente nao tem policy de INSERT em sessoes (so admin tem,
-- via "admin gerencia todas as sessoes"). Em vez de abrir uma policy
-- generica, usa uma RPC (mesmo padrao do responder_sessao) que so
-- deixa criar uma sessao com status 'solicitada' em nome dele mesmo.
create or replace function public.solicitar_sessao(
  data_sessao date,
  hora_sessao time,
  tipo_sessao text default 'tratamento',
  observacoes_sessao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_sessao_id uuid;
begin
  insert into public.sessoes (paciente_id, data, hora, tipo, observacoes, status, criado_por)
  values (auth.uid(), data_sessao, hora_sessao, tipo_sessao, observacoes_sessao, 'solicitada', auth.uid())
  returning id into nova_sessao_id;

  return nova_sessao_id;
end;
$$;

-- ==========================================================
-- TETO MENSAL DE EMAILS (pra nao estourar o plano gratuito do
-- provedor e gerar custo sem querer). Uma linha por mes (ex: '2026-10').
-- ==========================================================
create table if not exists public.contador_emails (
  mes text primary key,
  enviados int not null default 0
);

alter table public.contador_emails enable row level security;
-- sem policies: so acessivel via a funcao security definer abaixo.

create or replace function public.registrar_envio_email(limite int default 2900)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  mes_atual text := to_char(now(), 'YYYY-MM');
  atual int;
begin
  insert into public.contador_emails (mes, enviados)
  values (mes_atual, 0)
  on conflict (mes) do nothing;

  select enviados into atual from public.contador_emails where mes = mes_atual for update;

  if atual >= limite then
    return false;
  end if;

  update public.contador_emails set enviados = enviados + 1 where mes = mes_atual;
  return true;
end;
$$;
