/**
 * Schema-driven dynamic form fields.
 *
 * Used by DirectTopUpProduct to describe the inputs required to fulfill an
 * order (Player ID, Server, Zone, etc.). The DynamicForm renderer consumes
 * these directly. No supplier/backend calls happen here — this is purely the
 * contract for rendering + client-side validation.
 */

import type { Localized } from "./common";

/** Rendering direction. `ltr` keeps IDs/codes/emails/phones LTR under Arabic. */
export type InputDirection = "auto" | "ltr" | "rtl";

/** Maps to the browser `inputMode` attribute. */
export type KeyboardType = "default" | "numeric" | "email" | "tel" | "url";

/** Value transforms applied as the user types (and trim on blur). */
export type FieldNormalization = {
  /** Trim leading/trailing whitespace (applied on blur). */
  trim?: boolean;
  /** Keep digits only. */
  digitsOnly?: boolean;
  /** Remove all whitespace. */
  stripWhitespace?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
};

export type FieldOption = {
  value: string;
  label: Localized;
  /** Extra terms used by searchable selects when filtering. */
  keywords?: string[];
};

export type FieldValidationRule = {
  minLength?: number;
  maxLength?: number;
  /** Regex source (no delimiters); anchored during validation. */
  pattern?: string;
  /** Localized error message shown when validation fails. */
  errorMessage?: Localized;
};

type FieldBase = {
  /** Stable key used in FieldValues and fulfillment payloads. */
  key: string;
  label: Localized;
  placeholder?: Localized;
  helpText?: Localized;
  required?: boolean;
  direction?: InputDirection;
};

export type TextField = FieldBase & {
  type: "text";
  keyboard?: KeyboardType;
  normalization?: FieldNormalization;
  validation?: FieldValidationRule;
};

export type NumericTextField = FieldBase & {
  type: "numeric_text";
  normalization?: FieldNormalization;
  validation?: FieldValidationRule;
};

export type SelectField = FieldBase & {
  type: "select";
  options: FieldOption[];
  validation?: Pick<FieldValidationRule, "errorMessage">;
};

export type SearchableSelectField = FieldBase & {
  type: "searchable_select";
  options: FieldOption[];
  searchPlaceholder?: Localized;
  validation?: Pick<FieldValidationRule, "errorMessage">;
};

export type RadioField = FieldBase & {
  type: "radio";
  options: FieldOption[];
  validation?: Pick<FieldValidationRule, "errorMessage">;
};

/** Non-input, read-only informational block (guidance, warnings). */
export type InfoField = {
  type: "info";
  key: string;
  label: Localized;
  body: Localized;
  tone?: "info" | "warning";
};

export type DynamicTopUpField =
  TextField | NumericTextField | SelectField | SearchableSelectField | RadioField | InfoField;

export type FieldValues = Record<string, string>;

/** Compatibility alias retained for existing imports. */
export type FieldSchema = DynamicTopUpField;

export type FieldError = { key: string; message: Localized };

const REQUIRED_MESSAGE: Localized = { en: "This field is required", ar: "هذا الحقل مطلوب" };
const INVALID_FORMAT: Localized = { en: "Invalid format", ar: "صيغة غير صالحة" };
const INVALID_OPTION: Localized = {
  en: "Choose a valid option",
  ar: "اختر خياراً صالحاً",
};

/** True when the field holds a user-entered value (i.e. not informational). */
export function isInputField(
  field: DynamicTopUpField,
): field is Exclude<DynamicTopUpField, InfoField> {
  return field.type !== "info";
}

function hasOptions(
  field: DynamicTopUpField,
): field is SelectField | SearchableSelectField | RadioField {
  return field.type === "select" || field.type === "searchable_select" || field.type === "radio";
}

/** Applies live normalization. `trim` is deferred to `normalizeOnBlur`. */
export function normalizeOnInput(field: DynamicTopUpField, raw: string): string {
  if (!isInputField(field)) return raw;
  const rules =
    field.type === "text" || field.type === "numeric_text" ? field.normalization : undefined;
  const digitsOnly = field.type === "numeric_text" || rules?.digitsOnly;
  let value = raw;
  if (digitsOnly) value = value.replace(/[^\d]/g, "");
  if (rules?.stripWhitespace) value = value.replace(/\s+/g, "");
  if (rules?.uppercase) value = value.toUpperCase();
  if (rules?.lowercase) value = value.toLowerCase();
  return value;
}

export function normalizeOnBlur(field: DynamicTopUpField, raw: string): string {
  const value = normalizeOnInput(field, raw);
  if (
    (field.type === "text" || field.type === "numeric_text") &&
    field.normalization?.trim !== false
  ) {
    return value.trim();
  }
  return value;
}

export function validateField(
  field: DynamicTopUpField,
  value: string | undefined,
): FieldError | null {
  if (!isInputField(field)) return null;

  const trimmed = (value ?? "").trim();

  if (field.required && !trimmed) {
    const message =
      (field.type === "text" || field.type === "numeric_text") && field.validation?.errorMessage
        ? field.validation.errorMessage
        : REQUIRED_MESSAGE;
    return { key: field.key, message };
  }

  if (!trimmed) return null;

  if (hasOptions(field)) {
    const known = field.options.some((o) => o.value === trimmed);
    if (!known) {
      return { key: field.key, message: field.validation?.errorMessage ?? INVALID_OPTION };
    }
    return null;
  }

  const rule = field.validation;
  if (!rule) return null;

  if (rule.pattern) {
    const re = new RegExp("^(?:" + rule.pattern + ")$");
    if (!re.test(trimmed)) {
      return { key: field.key, message: rule.errorMessage ?? INVALID_FORMAT };
    }
  }
  if (rule.minLength !== undefined && trimmed.length < rule.minLength) {
    return {
      key: field.key,
      message: rule.errorMessage ?? {
        en: `Must be at least ${rule.minLength} characters`,
        ar: `يجب أن يكون ${rule.minLength} أحرف على الأقل`,
      },
    };
  }
  if (rule.maxLength !== undefined && trimmed.length > rule.maxLength) {
    return {
      key: field.key,
      message: rule.errorMessage ?? {
        en: `Must be at most ${rule.maxLength} characters`,
        ar: `يجب ألا يتجاوز ${rule.maxLength} حرفاً`,
      },
    };
  }

  return null;
}

export function validateAll(fields: DynamicTopUpField[], values: FieldValues): FieldError[] {
  return fields
    .map((field) => (isInputField(field) ? validateField(field, values[field.key]) : null))
    .filter((error): error is FieldError => error !== null);
}
