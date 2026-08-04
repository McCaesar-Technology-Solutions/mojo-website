import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { useAuth } from "@/contexts/auth-context";

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
    <div className="min-h-screen bg-brand-50 text-brand-900">
      <SiteNav />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm ring-1 ring-brand-900/5 p-8">
          <h1 className="text-2xl font-light">Sign in</h1>
          <p className="mt-2 text-sm text-gray-600">Access your trips and saved stays.</p>
          {!isConfigured && (
            <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3">
              Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable
              auth.
            </p>
          )}
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              void signIn(email, password)
                .then(() => navigate({ to: "/account/trips" }))
                .catch((err) => setError(err instanceof Error ? err.message : "Sign in failed"))
                .finally(() => setLoading(false));
            }}
          >
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full py-3 rounded-full bg-royal text-white font-medium disabled:opacity-40"
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
            className="mt-3 w-full py-3 rounded-full border border-brand-900/15 text-sm font-medium disabled:opacity-40"
          >
            Email me a magic link
          </button>
          <p className="mt-6 text-sm text-center text-gray-600">
            New here?{" "}
            <Link to="/auth/sign-up" className="text-royal underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
