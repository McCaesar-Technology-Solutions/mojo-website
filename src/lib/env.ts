export function getAppEnv(): "local" | "staging" | "production" {
  const v = (import.meta.env.VITE_APP_ENV ?? import.meta.env.APP_ENV ?? "local") as string;
  if (v === "staging" || v === "production") return v;
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

export function getAppUrl() {
  return (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") || "";
}

export function getWhatsAppNumber() {
  return (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || "233000000000";
}
