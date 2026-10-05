import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/clinica";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog"],
      // Área logada: não tem o que indexar e não deve aparecer em busca.
      disallow: ["/inicio", "/exercicios", "/dashboard", "/perfil", "/treino", "/login", "/auth"],
    },
    sitemap: `${urlDoSite()}/sitemap.xml`,
  };
}
