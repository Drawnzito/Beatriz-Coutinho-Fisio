-- Rode no SQL Editor do Supabase, depois do schema_17_especialidade.sql.
--
-- BUG REAL encontrado em producao: public.perfis so tem policies de SELECT
-- (nunca teve policy de UPDATE pra usuario comum). Isso fazia os updates de
-- "Seu WhatsApp" (atualizarMeuWhatsapp) e do guia de primeiros passos
-- (marcarGuiaVisto) falharem em silencio — o Supabase JS nao lanca erro,
-- so nao atualiza nenhuma linha, e o app seguia como se tivesse funcionado.
--
-- Correcao: em vez de abrir uma policy de UPDATE genérica em perfis (perigoso:
-- deixaria o proprio paciente, via chamada direta a API, alterar `papel` pra
-- 'admin' ou mexer em `arquivado_em`), usa RPCs security definer bem
-- restritas — mesmo padrao do responder_sessao/solicitar_sessao.

create or replace function public.atualizar_meu_whatsapp(novo_whatsapp text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.perfis set whatsapp = novo_whatsapp where id = auth.uid();
end;
$$;

create or replace function public.marcar_guia_visto()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.perfis set guia_visto_em = now() where id = auth.uid();
end;
$$;
