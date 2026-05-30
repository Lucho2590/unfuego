// Módulo de settings de transferencia bancaria. A diferencia de MercadoPago, acá los
// datos NO son secretos (se muestran al comprador), así que viven en DB (`settings/transfer`).
import { fsGet, fsSet } from "../firebase/admin";
import type { TransferSettings } from "../types";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "transfer";

const DEFAULTS: TransferSettings = {
  enabled: false,
  discountPercent: 0,
  bank: "",
  titular: "",
  cbu: "",
  alias: "",
  cuit: "",
  instructions: "",
};

/** Settings completas (para admin). Devuelve defaults si el doc no existe. */
export async function getTransferSettings(): Promise<TransferSettings> {
  const doc = (await fsGet(SETTINGS_COLLECTION, SETTINGS_DOC)) as
    | (TransferSettings & { id: string })
    | null;
  if (!doc) return { ...DEFAULTS };
  return {
    enabled: !!doc.enabled,
    discountPercent: Number(doc.discountPercent) || 0,
    bank: doc.bank ?? "",
    titular: doc.titular ?? "",
    cbu: doc.cbu ?? "",
    alias: doc.alias ?? "",
    cuit: doc.cuit ?? "",
    instructions: doc.instructions ?? "",
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

/**
 * Settings públicas (para checkout y página de transferencia). Hoy es casi idéntico a
 * getTransferSettings porque no hay secretos; se mantiene separado por simetría y para
 * poder filtrar campos en el futuro.
 */
export async function getPublicTransferSettings(): Promise<
  Omit<TransferSettings, "updatedBy">
> {
  const s = await getTransferSettings();
  return {
    enabled: s.enabled,
    discountPercent: s.discountPercent,
    bank: s.bank,
    titular: s.titular,
    cbu: s.cbu,
    alias: s.alias,
    cuit: s.cuit,
    instructions: s.instructions,
    updatedAt: s.updatedAt,
  };
}

/** Valida y guarda las settings de transferencia. Lanza si algún dato es inválido. */
export async function saveTransferSettings(
  input: Partial<TransferSettings>,
  updatedBy: string
): Promise<void> {
  const discountPercent = Number(input.discountPercent ?? 0);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("El descuento debe estar entre 0 y 100.");
  }

  const cbu = (input.cbu ?? "").trim();
  if (cbu && !/^\d{22}$/.test(cbu)) {
    throw new Error("El CBU debe tener 22 dígitos.");
  }

  const enabled = !!input.enabled;
  // Si se habilita, exigir al menos un dato para transferir (CBU o alias).
  if (enabled && !cbu && !(input.alias ?? "").trim()) {
    throw new Error("Para habilitar transferencia cargá al menos un CBU o alias.");
  }

  const data: TransferSettings = {
    enabled,
    discountPercent,
    bank: (input.bank ?? "").trim(),
    titular: (input.titular ?? "").trim(),
    cbu,
    alias: (input.alias ?? "").trim(),
    cuit: (input.cuit ?? "").trim(),
    instructions: (input.instructions ?? "").trim(),
    updatedBy,
  };

  await fsSet(
    SETTINGS_COLLECTION,
    SETTINGS_DOC,
    data as unknown as Record<string, unknown>,
    { timestamps: true }
  );
}
