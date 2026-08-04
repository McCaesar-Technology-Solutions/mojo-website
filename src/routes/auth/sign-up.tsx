import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({ meta: [{ title: "Create Account | MOJO Apartments" }] }),
  component: SignUpPage,
});

function SignUpPage() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900">
      <SiteNav />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm ring-1 ring-brand-900/5 p-8">
          <h1 className="text-2xl font-light">Create account</h1>
          <p className="mt-2 text-sm text-gray-600">Save stays and track your enquiries.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              void signUp(email, password, fullName)
                .then(() => navigate({ to: "/account/trips" }))
                .catch((err) => setError(err instanceof Error ? err.message : "Sign up failed"))
                .finally(() => setLoading(false));
            }}
          >
            <input
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
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
              minLength={8}
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-brand-900/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full py-3 rounded-full bg-royal text-white font-medium disabled:opacity-40"
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/auth/sign-in" className="text-royal underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
