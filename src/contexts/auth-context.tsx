import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/domain";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  const refreshProfile = async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    setProfile(await fetchProfile(session.user.id));
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await fetchProfile(data.session.user.id));
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) setProfile(await fetchProfile(next.user.id));
      else setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isConfigured: Boolean(supabase),
    isAdmin: profile?.role === ("admin" as UserRole),
    refreshProfile,
    async signIn(email, password) {
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password, fullName) {
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
    },
    async signInWithMagicLink(email) {
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/account" },
      });
      if (error) throw error;
    },
    async signOut() {
      if (!supabase) return;
      await supabase.auth.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
