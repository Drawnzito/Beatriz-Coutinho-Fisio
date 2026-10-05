import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Marca } from "@/components/Marca";
import { AcentoArabesque, AcentoCadencia } from "@/components/Acentos";
import { CLINICA, ESPECIALIDADES_SITE, urlDoSite } from "@/lib/clinica";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(urlDoSite()),
  title: `${CLINICA.nome} — ${CLINICA.chamada}`,
  description: CLINICA.descricao,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: CLINICA.nome,
    title: `${CLINICA.nome} — ${CLINICA.chamada}`,
    description: CLINICA.descricao,
    images: [{ url: "/marca/logo-com-nome-cartao.png", width: 1200, height: 630 }],
  },
};

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Quem já é paciente não precisa ver a vitrine: vai direto pro app.
  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("papel")
      .eq("id", user.id)
      .single();

    redirect(perfil?.papel === "admin" ? "/dashboard" : "/inicio");
  }

  const [{ data: posts }, { data: config }] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, titulo, resumo, capa_url, publicado_em")
      .eq("publicado", true)
      .order("publicado_em", { ascending: false })
      .limit(3),
    supabase.from("configuracoes_clinica").select("whatsapp_contato").eq("id", "global").maybeSingle(),
  ]);

  const whatsapp = config?.whatsapp_contato ? somenteDigitos(config.whatsapp_contato) : "";

  return (
    <>
      {/* ---------------------------------------------- topo ---------- */}
      <header
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(120% 70% at 15% 0%, rgba(255,255,255,0.10), transparent 55%), " +
            "linear-gradient(160deg, var(--cor-primaria) 0%, var(--cor-primaria-escura) 80%)",
          color: "#fff",
        }}
      >
        <AcentoArabesque
          tamanho={320}
          cor="#ffffff"
          opacidade={0.1}
          style={{ position: "absolute", top: -40, right: -60, pointerEvents: "none" }}
        />

        <div className="faixa-interna" style={{ padding: "26px 24px 56px", position: "relative" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Marca tamanho={38} corB="#ffffff" corC="rgba(255,255,255,0.8)" />
              <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: 0.4 }}>
                {CLINICA.profissional}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/blog" style={botaoFantasma}>
                Blog
              </Link>
              <Link href="/login" style={botaoClaro}>
                Entrar
              </Link>
            </div>
          </nav>

          <div style={{ maxWidth: 640, marginTop: 46 }}>
            <h1
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: 36,
                lineHeight: 1.15,
                margin: "0 0 14px",
              }}
            >
              {CLINICA.chamada}
            </h1>

            <AcentoCadencia largura={180} cor="#ffffff" opacidade={0.45} style={{ display: "block", margin: "0 0 18px" }} />

            <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.9)", margin: "0 0 26px" }}>
              {CLINICA.descricao}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...botaoClaro, background: "#25D366", color: "#fff", padding: "13px 22px", fontSize: 15 }}
                >
                  Falar no WhatsApp
                </a>
              )}
              <Link href="/login" style={{ ...botaoFantasma, padding: "13px 22px", fontSize: 15 }}>
                Já sou paciente
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------------ especialidades ---------- */}
        <section className="conteudo" style={{ paddingBottom: 8 }}>
          <h2 style={tituloSecao}>Especialidades</h2>
          <div className="grade-auto grade-auto--2">
            {ESPECIALIDADES_SITE.map((esp) => (
              <article key={esp.valor} style={cartao}>
                <h3
                  style={{
                    fontFamily: "var(--fonte-titulo)",
                    fontSize: 17,
                    color: "var(--cor-primaria)",
                    margin: "0 0 7px",
                  }}
                >
                  {esp.titulo}
                </h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--cor-texto-suave)" }}>
                  {esp.texto}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------------ acompanhamento ---------- */}
        <section className="conteudo" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div
            style={{
              ...cartao,
              background: "var(--cor-acento-suave)",
              borderColor: "var(--cor-acento-suave)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--fonte-titulo)",
                fontSize: 19,
                color: "var(--cor-acento)",
                margin: "0 0 8px",
              }}
            >
              O tratamento continua depois da sessão
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
              Cada paciente recebe um plano de exercícios no aplicativo, com vídeo e
              passo a passo de cada movimento. Dá pra marcar sessão, confirmar presença e
              acompanhar a evolução pelo celular — sem precisar lembrar de nada de cabeça.
            </p>
          </div>
        </section>

        {/* --------------------------------------------- blog ---------- */}
        {posts && posts.length > 0 && (
          <section className="conteudo" style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <h2 style={tituloSecao}>Do blog</h2>
              <Link href="/blog" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--cor-acento)" }}>
                ver tudo →
              </Link>
            </div>

            <div className="grade-auto grade-auto--3">
              {posts.map((post: any) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ ...cartao, textDecoration: "none", display: "block" }}>
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
                        marginBottom: 10,
                        display: "block",
                      }}
                    />
                  )}
                  <h3
                    style={{
                      fontFamily: "var(--fonte-titulo)",
                      fontSize: 16,
                      color: "var(--cor-primaria)",
                      margin: "0 0 6px",
                      lineHeight: 1.25,
                    }}
                  >
                    {post.titulo}
                  </h3>
                  {post.resumo && (
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--cor-texto-suave)" }}>
                      {post.resumo}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------ endereço ---------- */}
        <section className="conteudo" style={{ paddingTop: 8 }}>
          <h2 style={tituloSecao}>Onde atendo</h2>
          <div style={cartao}>
            <strong style={{ display: "block", fontSize: 15, color: "var(--cor-primaria-escura)" }}>
              {CLINICA.local}
            </strong>
            <p style={{ margin: "6px 0 14px", fontSize: 14, color: "var(--cor-texto-suave)" }}>
              {CLINICA.endereco}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={CLINICA.mapaUrl} target="_blank" rel="noreferrer" style={botaoEscuro}>
                Ver no mapa
              </a>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...botaoEscuro, background: "#25D366", borderColor: "#25D366" }}
                >
                  Agendar pelo WhatsApp
                </a>
              )}
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--cor-texto-suave)" }}>
              Fisioterapia pélvica também em <strong>atendimento domiciliar</strong>.
            </p>
          </div>
        </section>

        {/* ------------------------------------------- rodapé ---------- */}
        <footer
          style={{
            marginTop: 36,
            borderTop: "1px solid var(--cor-borda)",
            background: "var(--cor-superficie)",
          }}
        >
          <div
            className="faixa-interna"
            style={{
              padding: "26px 24px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Marca tamanho={32} />
              <div>
                <strong style={{ display: "block", fontSize: 13.5, color: "var(--cor-primaria-escura)" }}>
                  {CLINICA.nome}
                </strong>
                <span style={{ fontSize: 12, color: "var(--cor-texto-suave)" }}>
                  {CLINICA.cidade} — {CLINICA.estado}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 13, fontWeight: 600 }}>
              <Link href="/blog" style={{ color: "var(--cor-acento)" }}>
                Blog
              </Link>
              <Link href="/login" style={{ color: "var(--cor-acento)" }}>
                Entrar
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

const tituloSecao: React.CSSProperties = {
  fontFamily: "var(--fonte-titulo)",
  fontSize: 20,
  color: "var(--cor-primaria)",
  margin: "0 0 14px",
};

const cartao: React.CSSProperties = {
  padding: "18px 20px",
  borderRadius: 14,
  border: "1px solid var(--cor-borda)",
  background: "var(--cor-superficie)",
  color: "var(--cor-texto)",
};

const botaoClaro: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  background: "#fff",
  color: "var(--cor-primaria-escura)",
  fontWeight: 700,
  fontSize: 13.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const botaoFantasma: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.5)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const botaoEscuro: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: 999,
  border: "1px solid var(--cor-primaria)",
  background: "var(--cor-primaria)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
};
