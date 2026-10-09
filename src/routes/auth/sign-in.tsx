import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GuestShell } from "@/components/layout/guest-shell";
import { useAuth } from "@/contexts/auth-context";
import { getSupabase } from "@/lib/supabase/client";

async function destinationAfterSignIn(): Promise<"/admin" | "/account/trips"> {
  const supabase = getSupabase();
  if (!supabase) return "/account/trips";
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return "/account/trips";
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "admin" ? "/admin" : "/account/trips";
}

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({ meta: [{ title: "Sign In | MOJO Apartments" }] }),
  component: SignInPage,
});

function SignInPage() {
  const { signIn, signInWithMagicLink, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <GuestShell mainClassName="pt-28">
      <div className="mx-auto max-w-md border border-brand-900/10 bg-[#FBFaf7] px-6 py-8 sm:px-8">
        <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
          Sign in
        </h1>
        <div className="mt-3 h-px w-12 bg-gold" aria-hidden />
        <p className="mt-4 text-[1rem] text-brand-900/60">Access your trips and saved stays.</p>
        {!isConfigured ? (
          <p className="mt-4 border border-brand-900/10 bg-white px-4 py-3 text-[0.875rem] text-brand-900/70">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable
            auth.
          </p>
        ) : null}
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            void signIn(email, password)
              .then(() => destinationAfterSignIn())
              .then((to) => navigate({ to }))
              .catch((err) => setError(err instanceof Error ? err.message : "Sign in failed"))
              .finally(() => setLoading(false));
          }}
        >
          <label className="block">
            <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] text-brand-900 outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
            />
          </label>
          <label className="block">
            <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] text-brand-900 outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
            />
          </label>
          {error ? <p className="text-[0.875rem] text-red-700">{error}</p> : null}
          {message ? <p className="text-[0.875rem] text-brand-900/70">{message}</p> : null}
          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="w-full rounded-lg bg-royal px-4 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          disabled={!isConfigured || !email}
          onClick={() => {
            setError(null);
            void signInWithMagicLink(email)
              .then(() => setMessage("Magic link sent — check your email."))
              .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
          }}
          className="mt-3 w-full rounded-lg border border-brand-900/15 bg-white px-4 py-3 text-[0.9375rem] font-medium text-brand-900 transition hover:bg-lavender/60 disabled:opacity-40"
        >
          Email me a magic link
        </button>
        <p className="mt-6 text-center text-[0.875rem] text-brand-900/60">
          New here?{" "}
          <Link
            to="/auth/sign-up"
            className="font-medium text-royal underline decoration-gold/70 underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </GuestShell>
  );
}
