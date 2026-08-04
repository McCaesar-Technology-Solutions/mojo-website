import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

/** Browser / SSR anon client. Returns null when env is not configured. */
export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (typeof window === "undefined") {
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}
