import type { ReactNode } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

export function GuestShell({
  children,
  className,
  mainClassName,
}: {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
}) {
  return (
    <div className={cn("guest-site min-h-screen bg-[#F7F5F2] text-brand-900", className)}>
      <SiteNav />
      <main className={cn("px-5 pb-20 pt-24 md:px-6", mainClassName)}>{children}</main>
      <SiteFooter />
    </div>
  );
}
