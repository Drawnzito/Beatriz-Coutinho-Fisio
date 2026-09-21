-- Rode no SQL Editor do Supabase, depois dos scripts anteriores já aplicados.
-- PDF com o passo a passo do exercício (opcional, além do gif/vídeo).
alter table public.exercicios add column if not exists pdf_url text;
