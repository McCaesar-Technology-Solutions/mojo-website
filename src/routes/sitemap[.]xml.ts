import { createFileRoute } from "@tanstack/react-router";
import { getAppUrl, getSupabaseConfig } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

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
        let propertyPaths: string[] = [];
        const { url, anonKey, isConfigured } = getSupabaseConfig();
        if (isConfigured) {
          const supabase = createClient(url, anonKey);
          const { data } = await supabase
            .from("properties")
            .select("slug")
            .eq("status", "published");
          propertyPaths = (data ?? []).map((p) => `/properties/${p.slug}`);
        }
        const urls = [
          ...staticPaths.map((p) => `${base}${p}`),
          ...propertyPaths.map((p) => `${base}${p}`),
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
