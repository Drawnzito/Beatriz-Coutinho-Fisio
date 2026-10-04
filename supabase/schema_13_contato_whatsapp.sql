-- Rode no SQL Editor do Supabase, depois do schema_12_pdf_exercicio.sql.

-- WhatsApp do proprio paciente, pra Beatriz poder entrar em contato.
alter table public.perfis add column if not exists whatsapp text;
alter table public.convites_paciente add column if not exists whatsapp text;

-- Atualiza o gatilho de novo usuario pra tambem copiar o whatsapp do convite
-- (cadastro manual) quando a pessoa loga pela primeira vez com Google.
create or replace function public.lidar_novo_usuario()
returns trigger as $$
declare
  convite record;
begin
  select * into convite from public.convites_paciente where email = new.email limit 1;

  if convite is not null then
    insert into public.perfis (id, nome, email, idade, whatsapp)
    values (
      new.id,
      coalesce(nullif(convite.nome, ''), new.raw_user_meta_data->>'full_name'),
      new.email,
      convite.idade,
      convite.whatsapp
    );
    delete from public.convites_paciente where id = convite.id;
  else
    insert into public.perfis (id, nome, email)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- ==========================================================
-- Configuracao global da clinica: numero de WhatsApp Business
-- exibido pros pacientes (botao no menu/inicio). Linha unica,
-- id fixo 'global'. Editado pela Beatriz no painel.
-- ==========================================================
create table if not exists public.configuracoes_clinica (
  id text primary key default 'global',
  whatsapp_contato text,
  atualizado_em timestamptz not null default now()
);

insert into public.configuracoes_clinica (id) values ('global') on conflict (id) do nothing;

alter table public.configuracoes_clinica enable row level security;

drop policy if exists "qualquer um ve a configuracao da clinica" on public.configuracoes_clinica;
create policy "qualquer um ve a configuracao da clinica"
  on public.configuracoes_clinica for select
  using (true);

drop policy if exists "admin atualiza a configuracao da clinica" on public.configuracoes_clinica;
create policy "admin atualiza a configuracao da clinica"
  on public.configuracoes_clinica for update
  using (public.is_admin())
  with check (public.is_admin());
