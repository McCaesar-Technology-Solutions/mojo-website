import { Link } from "@tanstack/react-router";
import { coverUrl } from "@/lib/properties";
import { ghs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/domain";

export function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const img = coverUrl(property);
  const price = property.pricing?.nightly_rate ?? 0;
  const original = property.pricing?.original_nightly_rate;
  const flip = index % 2 === 1;

  return (
    <Link
      to="/properties/$slug"
      params={{ slug: property.slug }}
      className="guest-site group grid overflow-hidden bg-[#FBFaf7] md:grid-cols-2"
    >
      <div
        className={cn(
          "relative min-h-[240px] overflow-hidden bg-brand-900/5 sm:min-h-[320px] md:min-h-[380px]",
          flip && "md:order-2",
        )}
      >
        <img
          src={img}
          alt={property.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div
        className={cn(
          "flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 md:py-14",
          flip && "md:order-1",
        )}
      >
        <h3 className="font-[family-name:var(--font-guest-display)] text-[2rem] font-medium leading-[1.15] tracking-[-0.02em] text-brand-900">
          {property.title}
        </h3>
        <div className="mt-5 h-px w-16 bg-gold" aria-hidden />
        <p className="mt-5 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-brand-900/55">
          {property.city}
        </p>
        <p className="mt-3 text-[1.25rem] font-semibold tabular-nums text-brand-900">
          {ghs(price)}
          <span className="text-[0.8125rem] font-normal text-brand-900/50"> / night</span>
        </p>
        {original ? (
          <p className="mt-1 text-[0.8125rem] text-brand-900/40 line-through">{ghs(original)}</p>
        ) : null}
        <span className="mt-8 inline-flex text-[0.8125rem] font-medium text-royal underline decoration-gold/80 underline-offset-4 group-hover:decoration-royal">
          Request to Book
        </span>
      </div>
    </Link>
  );
}
