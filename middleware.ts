import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rotas que existem pra quem ainda não é paciente: a apresentação da
  // clínica e o blog. São elas que dão ao Google algo pra indexar — antes
  // disso o site inteiro respondia com um redirecionamento pro login.
  const rotaPublica =
    pathname === "/" ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // Arquivo de verificação do Google Search Console. Precisa responder o
    // conteúdo cru pro robô — se cair no redirecionamento do login, o Google
    // não consegue confirmar a propriedade do site. O padrão é estreito de
    // propósito: `startsWith("/google")` abriria qualquer rota futura que
    // começasse com essas seis letras.
    /^\/google[0-9a-f]+\.html$/.test(pathname) ||
    pathname === "/politica-de-privacidade";

  if (!user && !rotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";

    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Arquivos estáticos não passam pelo middleware. O `.html` entrou na
    // lista por causa do arquivo de verificação do Search Console.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|html)$).*)",
  ],
};
