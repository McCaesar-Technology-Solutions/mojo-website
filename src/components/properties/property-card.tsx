import { Link } from "@tanstack/react-router";
import { coverUrl } from "@/lib/properties";
import { locationLabel } from "@/lib/format";
import type { Property } from "@/types/domain";

export function PropertyCard({
  property,
  showDiscount = false,
}: {
  property: Property;
  showDiscount?: boolean;
}) {
  const img = coverUrl(property);
  const price = property.pricing?.nightly_rate ?? 0;
  const original = property.pricing?.original_nightly_rate;
  const discount = property.pricing?.discount_label;

  return (
    <Link
      to="/properties/$slug"
      params={{ slug: property.slug }}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl ring-1 ring-brand-900/5 transition-all duration-300 hover:-translate-y-1"
    >
      <div className={`relative overflow-hidden ${showDiscount ? "aspect-[5/4]" : "aspect-[4/5]"}`}>
        <img
          src={img}
          alt={property.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {showDiscount && discount ? (
          <span className="absolute top-3 left-3 bg-royal text-white text-xs font-medium px-3 py-1 rounded-full">
            {discount}
          </span>
        ) : (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-brand-900 shadow-sm">
            {property.type}
          </span>
        )}
        {!showDiscount && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
            <span className="text-white text-sm font-medium underline decoration-gold underline-offset-4 decoration-2">
              View Details
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-brand-900">{property.title}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <iconify-icon icon="solar:map-point-linear" width="14" />
              {locationLabel(property.city, property.area)}
            </p>
          </div>
          {property.rating != null && (
            <div className="flex items-center gap-1 text-sm">
              <iconify-icon icon="solar:star-bold" width="14" style={{ color: "#C89B2C" }} />
              <span className="font-medium">{property.rating}</span>
            </div>
          )}
        </div>
        <div
          className={`mt-3 flex items-baseline gap-2 ${showDiscount ? "pt-4 border-t border-gray-100" : ""}`}
        >
          <span className="text-lg font-semibold text-brand-900">GHS {price.toLocaleString()}</span>
          {original ? (
            <span className="text-sm text-gray-400 line-through underline-offset-4">
              GHS {original.toLocaleString()}
            </span>
          ) : (
            <span className="text-sm text-gray-500">/ night</span>
          )}
        </div>
        {showDiscount && (
          <span className="mt-4 w-full py-2.5 rounded-full border border-brand-900/15 text-sm font-medium text-brand-900 text-center group-hover:bg-royal group-hover:text-white group-hover:border-royal transition">
            Book Now
          </span>
        )}
      </div>
    </Link>
  );
}
