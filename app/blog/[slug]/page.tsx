import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopoPublico } from "@/components/TopoPublico";
import { BottomNav } from "@/components/BottomNav";
import { AcentoCadencia } from "@/components/Acentos";
import { CLINICA, urlDoSite } from "@/lib/clinica";
import { papelVisivel } from "@/lib/papelVisivel";

export const dynamic = "force-dynamic";

async function buscarPost(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, titulo, resumo, conteudo, capa_url, publicado_em, link_externo")
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await buscarPost(params.slug);
  if (!post) return { title: `Post não encontrado — ${CLINICA.nome}` };

  const descricao = post.resumo || CLINICA.descricao;

  return {
    metadataBase: new URL(urlDoSite()),
    title: `${post.titulo} — ${CLINICA.nome}`,
    description: descricao,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      url: `/blog/${post.slug}`,
      siteName: CLINICA.nome,
      title: post.titulo,
      description: descricao,
      publishedTime: post.publicado_em ?? undefined,
      images: post.capa_url
        ? [{ url: post.capa_url }]
        : [{ url: "/marca/logo-com-nome-cartao.png", width: 1200, height: 630 }],
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await buscarPost(params.slug);
  if (!post) notFound();

  const supabase = createClient();
  const papel = await papelVisivel(supabase);

  // O conteúdo é texto simples escrito pela Beatriz: cada linha em branco
  // separa um parágrafo. Renderizar como texto (e não como HTML) é
  // deliberado — evita qualquer risco de injeção vindo do editor.
  const paragrafos = post.conteudo
    .split(/\n{2,}/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <>
      {!papel && <TopoPublico />}

      <main className="conteudo" style={{ maxWidth: 720, paddingBottom: papel ? 100 : 56 }}>
        <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: "var(--cor-acento)" }}>
          ← Blog
        </Link>

        <article>
          {post.publicado_em && (
            <time
              dateTime={post.publicado_em}
              style={{ display: "block", marginTop: 20, fontSize: 12, fontWeight: 600, color: "var(--cor-acento)" }}
            >
              {new Date(post.publicado_em).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}

          <h1
            style={{
              fontFamily: "var(--fonte-titulo)",
              fontSize: 30,
              lineHeight: 1.2,
              color: "var(--cor-primaria)",
              margin: "8px 0 12px",
            }}
          >
            {post.titulo}
          </h1>

          <AcentoCadencia largura={150} opacidade={0.5} style={{ display: "block", margin: "0 0 20px" }} />

          {post.capa_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.capa_url}
              alt=""
              style={{
                width: "100%",
                borderRadius: 14,
                marginBottom: 24,
                display: "block",
                border: "1px solid var(--cor-borda)",
              }}
            />
          )}

          {post.resumo && (
            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.6,
                fontWeight: 500,
                color: "var(--cor-primaria-escura)",
                margin: "0 0 22px",
                paddingLeft: 14,
                borderLeft: "3px solid var(--cor-acento-suave)",
              }}
            >
              {post.resumo}
            </p>
          )}

          {paragrafos.map((paragrafo: string, indice: number) => (
            <p key={indice} style={{ fontSize: 15.5, lineHeight: 1.75, margin: "0 0 18px" }}>
              {paragrafo}
            </p>
          ))}

          {post.link_externo && (
            <a
              href={post.link_externo}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "12px 20px",
                borderRadius: 999,
                background: "var(--cor-primaria)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Ler o artigo completo →
            </a>
          )}
        </article>

        <aside
          style={{
            marginTop: 40,
            padding: "20px 22px",
            borderRadius: 14,
            background: "var(--cor-acento-suave)",
          }}
        >
          <strong
            style={{
              display: "block",
              fontFamily: "var(--fonte-titulo)",
              fontSize: 17,
              color: "var(--cor-acento)",
              marginBottom: 6,
            }}
          >
            Quer agendar uma avaliação?
          </strong>
          <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
            {CLINICA.local} — {CLINICA.endereco}
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 999,
              background: "var(--cor-acento)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13.5,
              textDecoration: "none",
            }}
          >
            Conhecer o atendimento
          </Link>
        </aside>
      </main>

      {papel && <BottomNav papel={papel} />}
    </>
  );
}
