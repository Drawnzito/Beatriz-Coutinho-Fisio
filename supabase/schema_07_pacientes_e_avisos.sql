-- Rode no SQL Editor do Supabase, depois dos scripts anteriores.

-- Idade do paciente
alter table public.perfis add column if not exists idade int;

-- Validade opcional dos avisos (em branco = nunca expira)
alter table public.avisos add column if not exists validade date;

-- ==========================================================
-- Cadastro manual de paciente (convite) — fica pendente até a
-- pessoa logar com Google pela primeira vez usando o mesmo e-mail.
-- ==========================================================
create table if not exists public.convites_paciente (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  idade int,
  email text not null unique,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.convites_paciente enable row level security;

drop policy if exists "admin gerencia convites" on public.convites_paciente;
create policy "admin gerencia convites"
  on public.convites_paciente for all
  using (public.is_admin())
  with check (public.is_admin());

-- Ao logar pela primeira vez, se houver convite pendente com o mesmo
-- e-mail, usa nome/idade preenchidos pela Beatriz e apaga o convite.
create or replace function public.lidar_novo_usuario()
returns trigger as $$
declare
  convite record;
begin
  select * into convite from public.convites_paciente where email = new.email limit 1;

  if convite is not null then
    insert into public.perfis (id, nome, email, idade)
    values (
      new.id,
      coalesce(nullif(convite.nome, ''), new.raw_user_meta_data->>'full_name'),
      new.email,
      convite.idade
    );
    delete from public.convites_paciente where id = convite.id;
  else
    insert into public.perfis (id, nome, email)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  end if;

  return new;
end;
$$ language plpgsql security definer;
