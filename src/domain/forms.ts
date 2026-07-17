/**
 * Schema-driven dynamic form fields.
 *
 * Used by top-up products to describe the inputs required to fulfill an order
 * (Player ID, Server, etc.). The DynamicForm renderer consumes these directly.
 */

import type { Localized } from "./common";

export type FieldValidation = {
  /** Regex source (no delimiters). */
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  /** Numeric range (only meaningful for number fields). */
  min?: number;
  max?: number;
  /** Localized error message shown when validation fails. */
  errorMessage?: Localized;
};

export type FieldOption = {
  value: string;
  label: Localized;
};

export type DynamicTopUpField =
  | {
      kind: "text";
      id: string;
      label: Localized;
      placeholder?: Localized;
      helpText?: Localized;
      required?: boolean;
      /** Force LTR rendering even under Arabic (IDs, emails, phone numbers). */
      ltr?: boolean;
      /** Numeric-only inputMode; still stored as string. */
      numericOnly?: boolean;
      validation?: FieldValidation;
    }
  | {
      kind: "number";
      id: string;
      label: Localized;
      placeholder?: Localized;
      helpText?: Localized;
      required?: boolean;
      validation?: FieldValidation;
    }
  | {
      kind: "select";
      id: string;
      label: Localized;
      helpText?: Localized;
      required?: boolean;
      options: FieldOption[];
    };

export type FieldValues = Record<string, string>;

/** Compatibility name used by the existing form renderer. */
export type FieldSchema = DynamicTopUpField;

export type FieldError = { id: string; message: Localized };

export function validateField(schema: FieldSchema, value: string | undefined): FieldError | null {
  const v = (value ?? "").trim();
  if (schema.required && !v) {
    return {
      id: schema.id,
      message: (schema as { validation?: FieldValidation }).validation?.errorMessage ?? {
        en: "Required",
        ar: "مطلوب",
      },
    };
  }
  if (!v) return null;
  if (schema.kind === "select") return null;

  const val = schema.validation;
  if (val?.pattern) {
    const re = new RegExp("^" + val.pattern + "$");
    if (!re.test(v))
      return {
        id: schema.id,
        message: val.errorMessage ?? { en: "Invalid format", ar: "صيغة غير صالحة" },
      };
  }
  if (val?.minLength && v.length < val.minLength)
    return {
      id: schema.id,
      message: val.errorMessage ?? {
        en: `Min ${val.minLength} chars`,
        ar: `الحد الأدنى ${val.minLength}`,
      },
    };
  if (val?.maxLength && v.length > val.maxLength)
    return {
      id: schema.id,
      message: val.errorMessage ?? {
        en: `Max ${val.maxLength} chars`,
        ar: `الحد الأقصى ${val.maxLength}`,
      },
    };

  if (schema.kind === "number") {
    const n = Number(v);
    if (Number.isNaN(n))
      return {
        id: schema.id,
        message: val?.errorMessage ?? { en: "Must be a number", ar: "يجب أن يكون رقماً" },
      };
    if (val?.min !== undefined && n < val.min)
      return {
        id: schema.id,
        message: val?.errorMessage ?? { en: `Min ${val.min}`, ar: `الحد الأدنى ${val.min}` },
      };
    if (val?.max !== undefined && n > val.max)
      return {
        id: schema.id,
        message: val?.errorMessage ?? { en: `Max ${val.max}`, ar: `الحد الأقصى ${val.max}` },
      };
  }

  return null;
}

export function validateAll(schemas: FieldSchema[], values: FieldValues): FieldError[] {
  return schemas
    .map((s) => validateField(s, values[s.id]))
    .filter((e): e is FieldError => e !== null);
}
