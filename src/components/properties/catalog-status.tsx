import type { ReactNode } from "react";

export function CatalogUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-dashed border-brand-900/15 px-6 py-16 text-center">
      <p className="text-[1.0625rem] text-brand-900">
        Stays could not be loaded. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-royal px-5 text-[0.9375rem] font-medium text-white transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F2]"
      >
        Try again
      </button>
    </div>
  );
}

export function CatalogLoading() {
  return (
    <p className="min-h-28 text-[1rem] text-brand-900/70" aria-live="polite">
      Loading stays…
    </p>
  );
}

export function CatalogEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-brand-900/15 px-6 py-16 text-center text-[1.0625rem] text-brand-900/70">
      {children}
    </div>
  );
}
