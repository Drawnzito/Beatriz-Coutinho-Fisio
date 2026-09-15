# Beatriz Coutinho Fisioterapia — app

Scaffold inicial: Next.js 14 (App Router) + Supabase (auth + Postgres) com login via Google.
Tudo gratuito nos tiers free da Vercel e do Supabase.

## 1. Criar o projeto no Supabase

1. Crie uma conta em https://supabase.com e um novo projeto (plano Free).
2. Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql` e, em seguida, de `supabase/schema_02.sql`
   (esse segundo cria exercícios, planos, sessões e avisos).
3. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public key`

## 2. Ativar login com Google

1. No Google Cloud Console (https://console.cloud.google.com), crie um projeto e uma
   credencial **OAuth Client ID** (tipo "Web application").
   - Em "Authorized redirect URIs", adicione a URL de callback que o Supabase mostra
     na tela abaixo (algo como `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
2. No Supabase, vá em **Authentication > Providers > Google**, ative e cole o
   `Client ID` e `Client Secret` gerados no Google Cloud.
3. Em **Authentication > URL Configuration**, adicione:
   - Site URL: `http://localhost:3000` (depois troque pela URL da Vercel)
   - Redirect URLs: `http://localhost:3000/auth/callback` (e a URL de produção depois)

## 3. Rodar local

```bash
cp .env.local.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Abra http://localhost:3000 — deve redirecionar para `/login`, entrar com Google e cair em `/inicio`.

## 4. Tornar a Beatriz admin

Depois que ela logar uma vez (isso cria a linha em `perfis` automaticamente), rode no
SQL Editor do Supabase:

```sql
update public.perfis set papel = 'admin' where email = 'email-dela@gmail.com';
```

## 5. Deploy gratuito (Vercel)

1. Suba este projeto num repositório no GitHub.
2. Em https://vercel.com, importe o repositório (plano Free).
3. Adicione as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) nas configurações do projeto na Vercel.
4. Atualize no Supabase (Authentication > URL Configuration) a Site URL e Redirect URL
   para o domínio que a Vercel gerar.

## Estrutura

```
app/
  login/page.tsx          -> tela de login com Google
  auth/callback/route.ts  -> troca o código OAuth pela sessão
  inicio/page.tsx          -> placeholder da home do paciente
  dashboard/page.tsx       -> placeholder do painel da fisioterapeuta
lib/supabase/              -> clients (browser, server, middleware)
middleware.ts              -> protege rotas exigindo login
supabase/schema.sql        -> tabela de perfis (paciente/admin) + trigger
```

## O que já funciona

- Login com Google, redirecionamento automático por papel (`/dashboard` admin, `/inicio` paciente).
- Painel da fisioterapeuta: cadastrar exercícios na biblioteca, montar planos por paciente
  selecionando exercícios, publicar avisos.
- Tela do paciente: vê o(s) plano(s) ativo(s) com séries/repetições e link de vídeo, e o mural de avisos.

## Próximos passos

- Tela de calendário/agenda (tabela `sessoes` já existe no banco).
- Upload direto de vídeo/gif pro Supabase Storage (hoje o campo aceita um link, ex: Youtube não-listado).
- Edição de exercícios e planos (hoje só cadastra e remove).
- Melhorar a lista de pacientes no painel (hoje mostra só quem já logou uma vez).
