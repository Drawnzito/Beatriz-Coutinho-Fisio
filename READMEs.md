# Beatriz Coutinho Fisioterapia — app

Scaffold inicial: Next.js 14 (App Router) + Supabase (auth + Postgres) com login via Google.
Tudo gratuito nos tiers free da Vercel e do Supabase.

## 1. Criar o projeto no Supabase

1. Crie uma conta em https://supabase.com e um novo projeto (plano Free).
2. Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql`.
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

## Próximos passos (fora deste scaffold)

- Modelagem completa: `exercicios`, `planos`, `atribuicoes`, `avisos`.
- Redirecionar admin -> `/dashboard` e paciente -> `/inicio` a partir do papel em `perfis`.
- CRUD de exercícios com upload de vídeo/gif (Supabase Storage).
- Tela de calendário e mural de avisos.
