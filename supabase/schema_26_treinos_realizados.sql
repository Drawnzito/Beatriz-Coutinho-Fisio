-- Rode no SQL Editor do Supabase, depois do schema_25_itens_plano_atomico.sql.
--
-- A tela de treino (/treino/[planoId]) sempre funcionou como um guia ao vivo:
-- a paciente passava exercicio por exercicio, serie por serie, com descanso
-- cronometrado — e no fim nada era gravado. A Beatriz nao tinha como saber se
-- alguem chegou a treinar: so dava pra ver o plano que ela montou e as sessoes
-- presenciais. Esta tabela e o registro que faltava.
--
-- Escolhas, pra quem vier depois:
--
-- * Grava so o treino CONCLUIDO, nao o abandonado no meio. Registrar saida
--   exigiria confiar em beforeunload (que nao dispara de forma confiavel em
--   celular, e muito menos quando a pessoa so troca de aba) — o resultado
--   seria um historico cheio de "comecou" fantasma, pior que nenhum dado.
--
-- * `titulo_plano` fica copiado aqui junto do `plano_id`. Treino apagado da
--   biblioteca de planos nao pode levar o historico embora: a paciente FEZ
--   aquele treino, e isso continua verdade depois. Por isso o plano_id e
--   `on delete set null`, e o titulo sobrevive no proprio registro.
--
-- * `exercicios_feitos` e `series_feitas` tambem sao copia do momento: o plano
--   pode ser editado depois, e o que importa no historico e o que foi feito
--   naquele dia, nao o que o treino virou depois.
--
-- * Ninguem tem UPDATE nem DELETE, nem a admin. E registro de fato acontecido.

create table if not exists public.treinos_realizados (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.perfis (id) on delete cascade,
  plano_id uuid references public.planos (id) on delete set null,
  titulo_plano text not null,
  exercicios_feitos int not null check (exercicios_feitos >= 0),
  series_feitas int not null check (series_feitas >= 0),
  concluido_em timestamptz not null default now()
);

-- As duas leituras do app: "os treinos desta paciente, do mais recente pro
-- mais antigo" (ficha no painel e historico dela) e a contagem por plano.
create index if not exists treinos_realizados_paciente_idx
  on public.treinos_realizados (paciente_id, concluido_em desc);

create index if not exists treinos_realizados_plano_idx
  on public.treinos_realizados (plano_id);

alter table public.treinos_realizados enable row level security;

-- O `exists` consulta planos, nao treinos_realizados: policy que consulta a
-- propria tabela foi o que causou a recursao infinita do schema_03.
drop policy if exists "paciente registra o proprio treino" on public.treinos_realizados;
create policy "paciente registra o proprio treino"
  on public.treinos_realizados for insert
  with check (
    paciente_id = auth.uid()
    and (
      plano_id is null
      or exists (
        select 1 from public.planos p
        where p.id = plano_id and p.paciente_id = auth.uid()
      )
    )
  );

drop policy if exists "paciente ve os proprios treinos" on public.treinos_realizados;
create policy "paciente ve os proprios treinos"
  on public.treinos_realizados for select
  using (paciente_id = auth.uid() or public.is_admin());
