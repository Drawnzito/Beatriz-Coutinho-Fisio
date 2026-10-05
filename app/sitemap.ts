import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { urlDoSite } from "@/lib/clinica";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlDoSite();

  const fixas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Se o banco estiver fora do ar, o sitemap ainda sai com as páginas fixas:
  // melhor um sitemap incompleto do que uma rota quebrada pro rastreador.
  try {
    const supabase = createClient();
    const { data: posts } = await supabase
      .from("posts")
      .select("slug, atualizado_em")
      .eq("publicado", true);

    return [
      ...fixas,
      ...(posts ?? []).map((post: any) => ({
        url: `${base}/blog/${post.slug}`,
        lastModified: post.atualizado_em ? new Date(post.atualizado_em) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return fixas;
  }
}
