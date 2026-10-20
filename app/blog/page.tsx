import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopoPublico } from "@/components/TopoPublico";
import { BottomNav } from "@/components/BottomNav";
import { CLINICA, urlDoSite, IMAGEM_COMPARTILHAMENTO } from "@/lib/clinica";
import { papelVisivel } from "@/lib/papelVisivel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(urlDoSite()),
  title: `Blog — ${CLINICA.nome}`,
  description:
    "Produção científica e conteúdo sobre fisioterapia pélvica, osteopatia e " +
    "reabilitação, por Beatriz Coutinho.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/blog",
    siteName: CLINICA.nome,
    title: `Blog — ${CLINICA.nome}`,
    description: "Produção científica e conteúdo sobre fisioterapia.",
    images: [IMAGEM_COMPARTILHAMENTO],
  },
};

export default async function BlogPage() {
  const supabase = createClient();

  // A mesma página serve visitante e paciente logada. Quem está logada
  // precisa da navegação do app, senão entra no blog e não acha o caminho
  // de volta; quem não está vê a barra pública, com botão de entrar.
  const [papel, { data: posts }] = await Promise.all([
    papelVisivel(supabase),
    supabase
      .from("posts")
      .select("slug, titulo, resumo, capa_url, publicado_em, link_externo")
      .eq("publicado", true)
      .order("publicado_em", { ascending: false }),
  ]);

  return (
    <>
      {!papel && <TopoPublico />}

      <main className="conteudo" style={{ paddingBottom: papel ? 100 : 56 }}>
        <h1
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: 28,
            color: "var(--cor-primaria)",
            margin: "0 0 6px",
          }}
        >
          Blog
        </h1>
        <p style={{ margin: "0 0 26px", fontSize: 14.5, color: "var(--cor-texto-suave)" }}>
          Produção científica e conteúdo sobre fisioterapia.
        </p>

        {(!posts || posts.length === 0) && (
          <p style={{ fontSize: 14.5, color: "var(--cor-texto-suave)" }}>
            Ainda não há publicações por aqui. Volte em breve.
          </p>
        )}

        <div className="grade-auto grade-auto--2">
          {(posts ?? []).map((post: any) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                display: "block",
                padding: 18,
                borderRadius: 14,
                border: "1px solid var(--cor-borda)",
                background: "var(--cor-superficie)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {post.capa_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.capa_url}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 12,
                    display: "block",
                  }}
                />
              )}

              {post.publicado_em && (
                <time
                  dateTime={post.publicado_em}
                  style={{ fontSize: 11.5, fontWeight: 600, color: "var(--cor-acento)" }}
                >
                  {new Date(post.publicado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              )}

              <h2
                style={{
                  fontFamily: "var(--fonte-titulo)",
                  fontSize: 18,
                  color: "var(--cor-primaria)",
                  margin: "6px 0 8px",
                  lineHeight: 1.25,
                }}
              >
                {post.titulo}
              </h2>

              {post.resumo && (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--cor-texto-suave)" }}>
                  {post.resumo}
                </p>
              )}

              {post.link_externo && (
                <span style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 700, color: "var(--cor-acento)" }}>
                  Artigo publicado
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>

      {papel && <BottomNav papel={papel} />}
    </>
  );
}
