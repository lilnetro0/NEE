import { useMemo, useState } from "react";
import { ChevronDown, Info, AlertTriangle, Check, Search } from "lucide-react";
import {
  isInputField,
  normalizeOnBlur,
  normalizeOnInput,
  validateField,
  type DynamicTopUpField,
  type FieldValues,
  type InputDirection,
  type KeyboardType,
  type SearchableSelectField,
} from "@/domain/forms";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

type Props = {
  fields: DynamicTopUpField[];
  values: FieldValues;
  onChange: (values: FieldValues) => void;
};

const INPUT_CLASS =
  "w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm outline-none focus:border-brand";

function inputModeFor(
  keyboard: KeyboardType | undefined,
): React.HTMLAttributes<HTMLInputElement>["inputMode"] {
  switch (keyboard) {
    case "numeric":
      return "numeric";
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "url":
      return "url";
    default:
      return undefined;
  }
}

function dirAttr(direction: InputDirection | undefined): "ltr" | "rtl" | undefined {
  return direction && direction !== "auto" ? direction : undefined;
}

/**
 * Schema-driven renderer. Supports text, numeric text, select, searchable
 * select, radio and informational fields. Applies normalization on input and
 * validates on blur; all messages are localized.
 */
export function DynamicForm({ fields, values, onChange }: Props) {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = (field: DynamicTopUpField, raw: string) => {
    onChange({ ...values, [field.key]: normalizeOnInput(field, raw) });
  };

  const blurField = (field: DynamicTopUpField) => {
    setTouched((prev) => ({ ...prev, [field.key]: true }));
    const normalized = normalizeOnBlur(field, values[field.key] ?? "");
    if (normalized !== (values[field.key] ?? "")) {
      onChange({ ...values, [field.key]: normalized });
    }
  };

  const selectOption = (field: DynamicTopUpField, value: string) => {
    setTouched((prev) => ({ ...prev, [field.key]: true }));
    onChange({ ...values, [field.key]: value });
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        if (field.type === "info") {
          return <InfoBlock key={field.key} field={field} isAr={isAr} />;
        }

        const error = touched[field.key] ? validateField(field, values[field.key]) : null;
        const label = isAr ? field.label.ar : field.label.en;
        const help =
          "helpText" in field && field.helpText
            ? isAr
              ? field.helpText.ar
              : field.helpText.en
            : null;

        return (
          <div key={field.key}>
            <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium">
              {label}
              {field.required && <span className="ms-1 text-destructive">*</span>}
            </label>

            {(field.type === "text" || field.type === "numeric_text") && (
              <input
                id={field.key}
                type="text"
                inputMode={
                  field.type === "numeric_text"
                    ? "numeric"
                    : inputModeFor(field.type === "text" ? field.keyboard : undefined)
                }
                dir={dirAttr(field.direction)}
                placeholder={
                  field.placeholder
                    ? isAr
                      ? field.placeholder.ar
                      : field.placeholder.en
                    : undefined
                }
                value={values[field.key] ?? ""}
                onChange={(e) => setValue(field, e.target.value)}
                onBlur={() => blurField(field)}
                className={INPUT_CLASS}
              />
            )}

            {field.type === "select" && (
              <div className="relative">
                <select
                  id={field.key}
                  value={values[field.key] ?? ""}
                  onChange={(e) => selectOption(field, e.target.value)}
                  onBlur={() => blurField(field)}
                  dir={dirAttr(field.direction)}
                  className={cn(INPUT_CLASS, "appearance-none pe-10")}
                >
                  <option value="" disabled>
                    {isAr ? "اختر..." : "Choose..."}
                  </option>
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {isAr ? o.label.ar : o.label.en}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}

            {field.type === "searchable_select" && (
              <SearchableSelect
                field={field}
                value={values[field.key] ?? ""}
                onSelect={(v) => selectOption(field, v)}
                isAr={isAr}
              />
            )}

            {field.type === "radio" && (
              <div className="grid grid-cols-2 gap-2">
                {field.options.map((o) => {
                  const active = values[field.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => selectOption(field, o.value)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-semibold",
                        active ? "border-brand bg-brand/10 text-brand" : "border-input bg-surface",
                      )}
                    >
                      {isAr ? o.label.ar : o.label.en}
                      {active && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}

            {help && !error && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
            {error && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {isAr ? error.message.ar : error.message.en}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoBlock({
  field,
  isAr,
}: {
  field: Extract<DynamicTopUpField, { type: "info" }>;
  isAr: boolean;
}) {
  const warning = field.tone === "warning";
  const Icon = warning ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-2xl border p-3 text-xs leading-relaxed",
        warning
          ? "border-warning/30 bg-warning/10 text-foreground/80"
          : "border-primary/20 bg-primary/5 text-muted-foreground",
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", warning ? "text-warning" : "text-primary")} />
      <div>
        <b className="text-sm text-foreground">{isAr ? field.label.ar : field.label.en}</b>
        <p className="mt-0.5">{isAr ? field.body.ar : field.body.en}</p>
      </div>
    </div>
  );
}

function SearchableSelect({
  field,
  value,
  onSelect,
  isAr,
}: {
  field: SearchableSelectField;
  value: string;
  onSelect: (value: string) => void;
  isAr: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = field.options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return field.options;
    return field.options.filter((o) => {
      const label = `${o.label.en} ${o.label.ar}`.toLowerCase();
      const keywords = (o.keywords ?? []).join(" ").toLowerCase();
      return label.includes(q) || keywords.includes(q) || o.value.toLowerCase().includes(q);
    });
  }, [field.options, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(INPUT_CLASS, "flex items-center justify-between text-start")}
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected
            ? isAr
              ? selected.label.ar
              : selected.label.en
            : isAr
              ? "ابحث واختر..."
              : "Search and select..."}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                field.searchPlaceholder
                  ? isAr
                    ? field.searchPlaceholder.ar
                    : field.searchPlaceholder.en
                  : isAr
                    ? "بحث..."
                    : "Search..."
              }
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-52 overflow-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-center text-xs text-muted-foreground">
                {isAr ? "لا توجد نتائج" : "No results"}
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onSelect(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-start text-sm hover:bg-surface",
                    o.value === value && "text-brand",
                  )}
                >
                  {isAr ? o.label.ar : o.label.en}
                  {o.value === value && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
