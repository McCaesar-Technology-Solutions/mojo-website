import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";

/**
 * Service-role client for trusted server contexts only (webhooks, admin jobs).
 * Never import this from client components.
 */
export function getServiceSupabase(): SupabaseClient | null {
  const { url, isConfigured } = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!isConfigured || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requireServiceSupabase(): SupabaseClient {
  const client = getServiceSupabase();
  if (!client) {
    throw new Error(
      "Service Supabase is not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return client;
}
