import type { ReactNode } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-50 text-brand-900">
      <SiteNav />
      <main className="pt-28 pb-20 px-6">
        <article className="max-w-3xl mx-auto prose prose-brand">
          <h1 className="text-3xl md:text-4xl font-light mb-6">{title}</h1>
          <div className="space-y-4 text-gray-700 leading-relaxed text-[15px]">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
