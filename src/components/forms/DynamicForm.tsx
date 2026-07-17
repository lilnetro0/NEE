import { useState } from "react";
import { validateAll, type FieldSchema, type FieldValues, type FieldError } from "@/domain/forms";
import type { AccountVerification } from "@/domain/product";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  schemas: FieldSchema[];
  value: FieldValues;
  onChange: (values: FieldValues) => void;
  /** Optional pre-checkout verification result to preview. */
  verification?: AccountVerification | null;
  onVerify?: () => Promise<void> | void;
  verifying?: boolean;
  showVerifyButton?: boolean;
};

/**
 * Schema-driven form renderer. Reads FieldSchema[] and produces controlled
 * inputs. Emits FieldValues on every change. Validation is exposed via the
 * returned <field-level> messages after a validate() call.
 */
export function DynamicForm({
  schemas,
  value,
  onChange,
  verification,
  onVerify,
  verifying,
  showVerifyButton,
}: Props) {
  const { locale } = useI18n();
  const [errors, setErrors] = useState<FieldError[]>([]);
  const isAr = locale === "ar";

  const set = (id: string, v: string) => {
    onChange({ ...value, [id]: v });
    setErrors((es) => es.filter((e) => e.id !== id));
  };

  const runValidate = () => {
    const es = validateAll(schemas, value);
    setErrors(es);
    return es.length === 0;
  };

  const errFor = (id: string) => errors.find((e) => e.id === id);

  return (
    <div className="space-y-4">
      {schemas.map((s) => {
        const err = errFor(s.id);
        const label = isAr ? s.label.ar : s.label.en;
        const help = s.kind !== "select" && s.helpText ? (isAr ? s.helpText.ar : s.helpText.en) : null;

        return (
          <div key={s.id}>
            <label htmlFor={s.id} className="mb-1.5 block text-sm font-medium">
              {label}
              {s.required && <span className="ms-1 text-destructive">*</span>}
            </label>

            {s.kind === "select" ? (
              <select
                id={s.id}
                value={value[s.id] ?? ""}
                onChange={(e) => set(s.id, e.target.value)}
                className="w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="" disabled>
                  {isAr ? "اختر..." : "Choose..."}
                </option>
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isAr ? o.label.ar : o.label.en}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={s.id}
                type={s.kind === "number" ? "number" : "text"}
                inputMode={
                  s.kind === "number" || (s.kind === "text" && s.numericOnly)
                    ? "numeric"
                    : undefined
                }
                dir={s.kind === "text" && s.ltr ? "ltr" : undefined}
                placeholder={
                  s.placeholder
                    ? isAr ? s.placeholder.ar : s.placeholder.en
                    : undefined
                }

                value={value[s.id] ?? ""}
                onChange={(e) => set(s.id, e.target.value)}
                className="w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary"
              />
            )}

            {help && !err && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
            {err && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {isAr ? err.message.ar : err.message.en}
              </p>
            )}
          </div>
        );
      })}

      {showVerifyButton && (
        <button
          type="button"
          onClick={async () => {
            if (runValidate()) await onVerify?.();
          }}
          disabled={verifying}
          className="w-full rounded-2xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary disabled:opacity-60"
        >
          {verifying
            ? isAr ? "جاري التحقق..." : "Verifying..."
            : isAr ? "تحقق من الحساب" : "Verify account"}
        </button>
      )}

      {verification && verification.ok && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
          <p className="font-semibold text-green-500">
            {isAr ? "تم التحقق من الحساب" : "Account verified"}
          </p>
          {verification.nickname && (
            <p className="mt-1 text-muted-foreground">
              {isAr ? "الاسم: " : "Nickname: "}
              <span dir="ltr" className="font-medium text-foreground">{verification.nickname}</span>
            </p>
          )}
          {verification.server && (
            <p className="text-muted-foreground">
              {isAr ? "السيرفر: " : "Server: "}
              <span dir="ltr" className="font-medium text-foreground">{verification.server}</span>
            </p>
          )}
        </div>
      )}

      {verification && !verification.ok && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {isAr ? verification.message.ar : verification.message.en}
        </div>
      )}
    </div>
  );
}

/** Exposes `validate()` to parents via ref-like callback. Keep it simple. */
export function useDynamicFormValidation(schemas: FieldSchema[], values: FieldValues) {
  return () => validateAll(schemas, values);
}
