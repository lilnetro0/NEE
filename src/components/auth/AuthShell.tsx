import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useNavigate } from "@tanstack/react-router";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { dir } = useI18n();
  const nav = useNavigate();
  const Back = dir === "rtl" ? ChevronRight : ChevronLeft;
  return (
    <div className="pt-safe flex min-h-[100dvh] flex-col bg-background px-6">
      <div className="py-3">
        <button
          onClick={() => nav({ to: ".." as never })}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface active:scale-95"
        >
          <Back className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand font-black text-brand-foreground">
            N
          </div>
          <span className="font-display text-xl font-black">NETRO</span>
        </div>
        <h1 className="font-display text-3xl font-black leading-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mt-8 flex-1 space-y-4">{children}</div>
      <div className="pb-safe pb-6">{footer}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "h-14 w-full rounded-2xl border border-input bg-surface px-4 text-base outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/30 " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "h-14 w-full rounded-full gradient-brand text-base font-bold text-brand-foreground shadow-elevated active:scale-[0.98] disabled:opacity-50 " +
        (rest.className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function LinkText({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to as never} className="text-sm font-semibold text-brand">
      {children}
    </Link>
  );
}
