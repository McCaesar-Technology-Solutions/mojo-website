export type AppEnv = "local" | "preview" | "staging" | "production";

/**
 * App environment for logging / feature gates.
 * Set VITE_APP_ENV on Vercel: `preview` (Preview) or `production` (Production).
 */
export function getAppEnv(): AppEnv {
  const v = (import.meta.env.VITE_APP_ENV ?? import.meta.env.APP_ENV ?? "local") as string;
  if (v === "production") return "production";
  if (v === "preview") return "preview";
  if (v === "staging") return "staging";
  return "local";
}

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return {
    url: url?.trim() || "",
    anonKey: anonKey?.trim() || "",
    isConfigured: Boolean(url?.trim() && anonKey?.trim()),
  };
}

/** Canonical public site URL (no trailing slash). Set VITE_APP_URL per Vercel environment. */
export function getAppUrl() {
  return (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") || "";
}

export function getWhatsAppNumber() {
  return (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || "233000000000";
}
