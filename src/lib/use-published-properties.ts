import { useCallback, useEffect, useState } from "react";
import { listPublishedProperties } from "@/lib/properties";
import type { Property } from "@/types/domain";

export function usePublishedProperties(opts?: { city?: string; guests?: number }) {
  const city = opts?.city;
  const guests = opts?.guests;
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void listPublishedProperties({ city, guests })
      .then(({ properties: list }) => {
        if (cancelled) return;
        setProperties(list);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProperties([]);
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, guests, reloadToken]);

  return { properties, loading, error, retry };
}
