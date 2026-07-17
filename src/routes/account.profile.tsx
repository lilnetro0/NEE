import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "sonner";
import { AsyncState } from "@/components/common/AsyncState";
import { useCurrentUser } from "@/data-access";
import type { User } from "@/domain/user";

export const Route = createFileRoute("/account/profile")({
  component: ProfileRoute,
});

function ProfileRoute() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}

function Profile() {
  const { t, locale } = useI18n();
  const auth = useAuth();
  const { status, data: user, error, reload } = useCurrentUser();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const resolved: User | undefined = auth.user ?? user;
  const asyncStatus =
    auth.user || status === "ready"
      ? "ready"
      : status === "error"
        ? "error"
        : status === "empty"
          ? "empty"
          : "loading";

  useEffect(() => {
    if (!resolved) return;
    setDisplayName(resolved.displayName ?? "");
    setEmail(resolved.email ?? "");
    setPhone(resolved.phone ?? "");
  }, [resolved]);

  const initial = (displayName || email || "?").slice(0, 1).toUpperCase();

  return (
    <MobileScreen>
      <TopBar title={t("profile")} showBack showCart={false} />
      <ScreenBody className="space-y-4">
        <AsyncState
          status={asyncStatus}
          data={resolved}
          error={error?.message ?? null}
          onRetry={reload}
          emptyLabel={locale === "ar" ? "لا يوجد ملف شخصي" : "No profile"}
        >
          {() => (
            <>
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-3xl gradient-brand font-black text-brand-foreground">
                  {initial}
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === "ar"
                    ? "رفع الصورة الشخصية سيتاح قريباً"
                    : "Profile photo upload coming soon"}
                </p>
              </div>
              <Field label={t("fullName")}>
                <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </Field>
              <Field label={t("email")}>
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label={t("phone")}>
                <TextInput
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <PrimaryButton
                onClick={() =>
                  toast.message(
                    locale === "ar"
                      ? "حفظ الملف الشخصي عبر الخادم قريباً"
                      : "Server-side profile save coming soon",
                  )
                }
              >
                {t("save")}
              </PrimaryButton>
            </>
          )}
        </AsyncState>
      </ScreenBody>
    </MobileScreen>
  );
}
