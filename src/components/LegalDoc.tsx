import type { ReactNode } from "react";
import { MobileScreen, TopBar, ScreenBody } from "@/components/shell/Shell";

export function LegalDoc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <MobileScreen>
      <TopBar title={title} showBack showCart={false} />
      <ScreenBody>
        <article className="prose-legal space-y-4 text-sm leading-relaxed text-muted-foreground">
          {children}
        </article>
      </ScreenBody>
    </MobileScreen>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-4 font-display text-base font-bold text-foreground">{children}</h2>;
}
