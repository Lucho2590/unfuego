import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Genera un slug URL-friendly a partir de un nombre (sin acentos, espacios → "-"). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// ─── Formato de números ───

/** Formatea un monto en pesos argentinos: 45000 → "$45.000" (sin decimales). */
export function formatCurrency(value: number | null | undefined): string {
  return `$${(value ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}

/** Agrupa una cadena de solo dígitos con separadores de miles: "45000" → "45.000". */
export function formatThousands(digits: string): string {
  if (!digits) return ""
  return Number(digits).toLocaleString("es-AR")
}

/** Deja solo los dígitos de un string (para inputs numéricos). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/**
 * Formatea un teléfono para mostrarlo de forma legible. Maneja el caso argentino
 * (prefijo +54 y 9 de celular) y agrupa el resto en bloques. Si no puede formatear
 * con confianza, devuelve el valor original tal cual.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ""
  const original = raw.trim()
  let digits = original.replace(/\D/g, "")
  if (digits.length < 8) return original // muy corto: no arriesgar formato

  let prefix = ""
  if (digits.startsWith("54")) {
    prefix = "+54 "
    digits = digits.slice(2)
    if (digits.startsWith("9")) {
      prefix += "9 "
      digits = digits.slice(1)
    }
  }

  const line = digits.slice(-4)
  const mid = digits.slice(-7, -4)
  const area = digits.slice(0, -7)

  const grouped = [area, mid].filter(Boolean).join(" ")
  return `${prefix}${grouped ? `${grouped}-${line}` : line}`.trim()
}

/** Genera el href `tel:` (solo + y dígitos) para enlazar un teléfono. */
export function telHref(raw: string): string {
  const cleaned = raw.trim().replace(/[^\d+]/g, "")
  return `tel:${cleaned}`
}

// ─── Precio con descuento ───

export interface PriceInfo {
  /** Precio final a cobrar (con descuento aplicado). */
  final: number
  /** Precio original (sin descuento). */
  original: number
  /** true si hay un descuento válido aplicado. */
  hasDiscount: boolean
  /** Porcentaje de descuento redondeado (para mostrar "-20%"). */
  percentOff: number
  /** Descripción del descuento (ej. "Por día del padre"), solo si hasDiscount. */
  description?: string
}

interface DiscountableProduct {
  price: number
  discountType?: "percentage" | "fixed" | null
  discountValue?: number | null
  discountDescription?: string | null
}

/**
 * Calcula el precio efectivo de un producto aplicando su descuento manual (% o monto fijo).
 * El resultado nunca es negativo; si el descuento no reduce el precio, hasDiscount = false.
 */
export function getProductPrice(product: DiscountableProduct): PriceInfo {
  const original = product.price
  const value = product.discountValue ?? 0
  let final = original

  if (product.discountType === "percentage" && value > 0) {
    final = original * (1 - value / 100)
  } else if (product.discountType === "fixed" && value > 0) {
    final = original - value
  }

  final = Math.max(0, Math.round(final))
  const hasDiscount = final < original

  return {
    final,
    original,
    hasDiscount,
    percentOff: hasDiscount ? Math.round((1 - final / original) * 100) : 0,
    description: hasDiscount
      ? product.discountDescription?.trim() || undefined
      : undefined,
  }
}
