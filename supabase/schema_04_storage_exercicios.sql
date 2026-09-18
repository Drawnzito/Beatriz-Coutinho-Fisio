-- Rode no SQL Editor do Supabase, depois do schema_03_fix_rls.sql.
-- Cria o bucket publico "exercicios" pra guardar fotos/gifs/videos
-- demonstrativos, com upload/remocao restritos ao admin.

insert into storage.buckets (id, name, public)
values ('exercicios', 'exercicios', true)
on conflict (id) do nothing;

drop policy if exists "qualquer um ve arquivos de exercicios" on storage.objects;
create policy "qualquer um ve arquivos de exercicios"
  on storage.objects for select
  using (bucket_id = 'exercicios');

drop policy if exists "admin faz upload de arquivos de exercicios" on storage.objects;
create policy "admin faz upload de arquivos de exercicios"
  on storage.objects for insert
  with check (bucket_id = 'exercicios' and public.is_admin());

drop policy if exists "admin remove arquivos de exercicios" on storage.objects;
create policy "admin remove arquivos de exercicios"
  on storage.objects for delete
  using (bucket_id = 'exercicios' and public.is_admin());
