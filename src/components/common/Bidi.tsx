import type { HTMLAttributes, ElementType } from "react";

/**
 * Renders content with a forced LTR direction even inside an RTL layout.
 *
 * Use for: gift-card codes, Player IDs, server IDs, phone numbers,
 * email addresses, order IDs, IBANs, card numbers, transaction IDs.
 *
 * Never wrap prose in <Bidi> — only atomic tokens that must read
 * left-to-right regardless of surrounding language.
 */
export function Bidi({
  as = "span",
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: keyof HTMLElementTagNameMap }) {
  const Tag = as as unknown as ElementType;
  return (
    <Tag dir="ltr" className={`inline-block [unicode-bidi:isolate] ${className ?? ""}`} {...rest}>
      {children}
    </Tag>
  );
}
