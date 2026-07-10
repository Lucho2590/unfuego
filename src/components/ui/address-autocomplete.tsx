"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Autocompletado de domicilio contra Nominatim (OpenStreetMap), sin API key.
 *
 * Política de uso de Nominatim (servidor público): máx. 1 request/segundo, conviene
 * enviar un User-Agent/Referer que identifique la app (desde el browser el Referer se
 * manda solo; el User-Agent no se puede setear) y NO es apto para alto volumen. El
 * debounce + el mínimo de 3 caracteres ayudan. Para producción con tráfico real conviene
 * self-hostear Nominatim o usar un proveedor pago (LocationIQ / Mapbox / Google Places),
 * cambiando solo el endpoint y el parseo de `formatAddress`.
 */

const ENDPOINT =
  "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=es&q=";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: Record<string, string | undefined>;
}

/** Arma el string único `Calle Número, Ciudad (CP), Provincia, País`. */
function formatAddress(result: NominatimResult): string {
  const a = result.address;

  const road = a.road || a.pedestrian || a.footway || a.residential;
  const street = road
    ? [road, a.house_number].filter(Boolean).join(" ")
    : result.display_name.split(",")[0]?.trim();

  const cityName = a.city || a.town || a.village || a.municipality || a.county;
  const city = cityName
    ? a.postcode
      ? `${cityName} (${a.postcode})`
      : cityName
    : undefined;

  const province = a.state || a.region;
  const country = a.country;

  return [street, city, province, country].filter(Boolean).join(", ");
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  id,
  placeholder,
  disabled,
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Solo buscamos cuando el usuario tipeó de verdad: así el valor precargado (modo
  // edición) no abre el dropdown y es robusto ante el doble montaje de StrictMode.
  const userTyped = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userTyped.current) return;

    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`${ENDPOINT}${encodeURIComponent(q)}`, {
          signal: controller.signal,
          headers: { "Accept-Language": "es" },
        });
        const data: NominatimResult[] = res.ok ? await res.json() : [];
        setResults(data);
        setOpen(true);
      } catch {
        // request abortado o error de red: ignorar
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  // Abortar cualquier request en curso al desmontar.
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSelect = (result: NominatimResult) => {
    userTyped.current = false;
    onChange(formatAddress(result));
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            userTyped.current = true;
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => {
            // Delay para que el click en una opción alcance a dispararse.
            blurTimeout.current = setTimeout(() => setOpen(false), 150);
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-md">
          <ul className="max-h-64 overflow-auto py-1">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  // onMouseDown (antes del blur) para que el click no se pierda.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimeout.current) clearTimeout(blurTimeout.current);
                    handleSelect(r);
                  }}
                  className={cn(
                    "block w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                    "truncate"
                  )}
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            Datos © OpenStreetMap
          </p>
        </div>
      )}
    </div>
  );
}
