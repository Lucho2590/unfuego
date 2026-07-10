"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneFieldProps {
  value?: string;
  /** Devuelve el número en E.164 (`+54...`), o `undefined` si se borra todo. */
  onChange: (value?: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Campo de teléfono controlado. Guarda un único string en formato E.164
 * (ej. `+5492235053759`). Para mostrarlo con formato usar `formatPhoneNumberIntl`
 * de `react-phone-number-input`.
 */
export function PhoneField({
  value,
  onChange,
  id,
  placeholder,
  disabled,
  className,
}: PhoneFieldProps) {
  return (
    <PhoneInput
      international
      defaultCountry="AR"
      countryCallingCodeEditable={false}
      value={value}
      onChange={(v) => onChange(v || undefined)}
      numberInputProps={{ id }}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        // Contenedor con la misma apariencia que <Input> del design system.
        "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] md:text-sm dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50",
        // Input interno sin borde propio (el borde lo pone el contenedor).
        "[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:text-base [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:md:text-sm [&_.PhoneInputInput]:placeholder:text-muted-foreground",
        "[&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountrySelectArrow]:opacity-60",
        className
      )}
    />
  );
}
