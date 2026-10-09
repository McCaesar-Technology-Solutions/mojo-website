import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OpsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-900/10 pb-4">
      <div>
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-brand-900">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-snug text-brand-900/55">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function OpsAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-lg border border-amber-900/15 bg-amber-50 px-3 py-2 text-[13px] text-amber-950"
    >
      {children}
    </p>
  );
}

export function OpsEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-40 items-center justify-center border border-dashed border-brand-900/15 bg-white/50 px-6 py-10 text-center text-[13px] text-brand-900/50">
      {children}
    </div>
  );
}

export function OpsPrimaryButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg bg-royal px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-royal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function OpsSecondaryButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-900/15 bg-white px-3.5 py-2 text-[13px] font-medium text-brand-900 transition hover:bg-brand-900/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function OpsStatus({
  status,
  tone = "neutral",
}: {
  status: string;
  tone?: "new" | "review" | "ok" | "bad" | "neutral";
}) {
  const tones: Record<typeof tone, string> = {
    new: "bg-gold/15 text-brand-900 ring-gold/35",
    review: "bg-lavender text-royal ring-royal/20",
    ok: "bg-emerald-50 text-emerald-900 ring-emerald-900/15",
    bad: "bg-rose-50 text-rose-900 ring-rose-900/15",
    neutral: "bg-brand-900/[0.04] text-brand-900/70 ring-brand-900/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ring-1",
        tones[tone],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function enquiryTone(status: string): "new" | "review" | "ok" | "bad" | "neutral" {
  if (status === "new") return "new";
  if (status === "in_review") return "review";
  if (status === "approved") return "ok";
  if (status === "declined" || status === "expired") return "bad";
  return "neutral";
}

export function OpsField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block text-[12px] font-medium text-brand-900/60", className)}>
      {label}
      <div className="mt-1 text-[13px] font-normal text-brand-900">{children}</div>
    </label>
  );
}

export function OpsInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-brand-900/12 bg-white px-3 py-2 text-[13px] text-brand-900 outline-none transition focus:border-royal/40 focus:ring-2 focus:ring-royal/15",
        props.className,
      )}
    />
  );
}

export function OpsSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full cursor-pointer appearance-none rounded-lg border border-brand-900/12 bg-white px-3 py-2 text-[13px] text-brand-900 outline-none transition focus:border-royal/40 focus:ring-2 focus:ring-royal/15",
        props.className,
      )}
    />
  );
}

export function OpsTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-brand-900/12 bg-white px-3 py-2 text-[13px] text-brand-900 outline-none transition focus:border-royal/40 focus:ring-2 focus:ring-royal/15",
        props.className,
      )}
    />
  );
}

export function OpsPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "border border-brand-900/10 bg-white shadow-[0_1px_2px_rgba(36,16,77,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OpsMetricStrip({
  items,
}: {
  items: { label: string; value: string; href?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-brand-900/10 border border-brand-900/10 bg-white sm:grid-cols-4">
      {items.map((item) => {
        const inner = (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-brand-900/45">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-brand-900">
              {item.value}
            </p>
          </>
        );
        return item.href ? (
          <a
            key={item.label}
            href={item.href}
            className="block px-4 py-3 transition hover:bg-lavender/40"
          >
            {inner}
          </a>
        ) : (
          <div key={item.label} className="px-4 py-3">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
