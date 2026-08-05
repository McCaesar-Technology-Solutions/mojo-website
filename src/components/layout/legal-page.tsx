import type { ReactNode } from "react";
import { GuestShell } from "@/components/layout/guest-shell";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GuestShell>
      <article className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-guest-display)] text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em] text-brand-900">
          {title}
        </h1>
        <div className="mt-2 h-px w-16 bg-gold" aria-hidden />
        <div className="mt-8 space-y-4 text-[1.0625rem] leading-relaxed text-brand-900/70 [&_a]:font-medium [&_a]:text-royal [&_a]:underline [&_a]:decoration-gold/70 [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-brand-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </GuestShell>
  );
}
