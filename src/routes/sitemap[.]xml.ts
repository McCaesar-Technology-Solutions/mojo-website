import { createFileRoute } from "@tanstack/react-router";
import { DEMO_PROPERTIES } from "@/data/demo-properties";
import { getAppUrl } from "@/lib/env";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const base = getAppUrl() || "https://mojoapartments.com";
        const staticPaths = [
          "",
          "/properties",
          "/about",
          "/support",
          "/cancellation",
          "/privacy",
          "/terms",
        ];
        const urls = [
          ...staticPaths.map((p) => `${base}${p}`),
          ...DEMO_PROPERTIES.map((p) => `${base}/properties/${p.slug}`),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>`;
        return new Response(body, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
