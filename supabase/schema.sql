-- Rode este script no SQL Editor do Supabase (painel do projeto).
-- Isso é só o mínimo pra sustentar o login. A modelagem completa
-- (exercícios, planos, agenda, avisos) entra na próxima etapa.

create type public.papel_usuario as enum ('paciente', 'admin');

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  email text,
  papel public.papel_usuario not null default 'paciente',
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

create policy "usuário vê o próprio perfil"
  on public.perfis for select
  using (auth.uid() = id);

create policy "admin vê todos os perfis"
  on public.perfis for select
  using (
    exists (
      select 1 from public.perfis p
      where p.id = auth.uid() and p.papel = 'admin'
    )
  );

-- cria automaticamente um perfil (papel = paciente) quando alguém faz login pela primeira vez
create function public.lidar_novo_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.lidar_novo_usuario();

-- Pra transformar a Beatriz em admin depois de ela logar uma vez:
-- update public.perfis set papel = 'admin' where email = 'email-dela@gmail.com';
