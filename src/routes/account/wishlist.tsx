import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/properties/property-card";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Property } from "@/types/domain";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist | MOJO Apartments" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setItems([]);
      return;
    }
    void supabase
      .from("wishlists")
      .select("property:properties(*, property_pricing(*), property_media(*))")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as { property: Property | null }[];
        setItems(rows.map((row) => row.property).filter(Boolean) as Property[]);
      });
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-light">Wishlist</h1>
      <p className="mt-2 text-gray-600">Saved stays for later.</p>
      {items.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          Nothing saved yet.{" "}
          <Link to="/properties" className="text-gold underline">
            Explore properties
          </Link>
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-6 md:gap-8">
          {items.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
