import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GuestShell } from "@/components/layout/guest-shell";
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
    <GuestShell mainClassName="pt-28">
      <div className="mx-auto max-w-md border border-brand-900/10 bg-[#FBFaf7] px-6 py-8 sm:px-8">
        <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
          Create account
        </h1>
        <div className="mt-3 h-px w-12 bg-gold" aria-hidden />
        <p className="mt-4 text-[1rem] text-brand-900/60">
          Save stays and track your Request to Book enquiries.
        </p>
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
          <label className="block">
            <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/45">
              Full name
            </span>
            <input
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] text-brand-900 outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
            />
          </label>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-brand-900/12 bg-white px-3 py-2.5 text-[0.9375rem] text-brand-900 outline-none focus:border-royal/40 focus:ring-2 focus:ring-royal/15"
            />
            <span className="mt-1 block text-[0.8125rem] text-brand-900/45">At least 8 characters</span>
          </label>
          {error ? <p className="text-[0.875rem] text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="w-full rounded-lg bg-royal px-4 py-3 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 disabled:opacity-40"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-[0.875rem] text-brand-900/60">
          Already have an account?{" "}
          <Link
            to="/auth/sign-in"
            className="font-medium text-royal underline decoration-gold/70 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </GuestShell>
  );
}
