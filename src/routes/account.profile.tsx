import { createFileRoute } from "@tanstack/react-router";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";
import { AuthShell, Field, TextInput, PrimaryButton } from "@/components/auth/AuthShell";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/account/profile")({
  component: Profile,
});

function Profile() {
  const { t } = useI18n();
  return (
    <MobileScreen>
      <TopBar title={t("profile")} showBack showCart={false} />
      <ScreenBody className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-3xl gradient-brand font-black text-brand-foreground">A</div>
          <button className="rounded-full bg-surface px-4 py-2 text-xs font-semibold">Change photo</button>
        </div>
        <Field label={t("fullName")}><TextInput defaultValue="Ahmad Al-Sayed" /></Field>
        <Field label={t("email")}><TextInput type="email" defaultValue="ahmad@example.com" /></Field>
        <Field label={t("phone")}><TextInput type="tel" defaultValue="+9665 555 5555" /></Field>
        <PrimaryButton onClick={() => toast.success("Saved")}>{t("save")}</PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}
