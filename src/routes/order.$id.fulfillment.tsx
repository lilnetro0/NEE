import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { useI18n } from "@/i18n/I18nProvider";
import { useOrderMutations } from "@/data-access";
import type { FulfillmentStatus } from "@/domain/order";

export const Route = createFileRoute("/order/$id/fulfillment")({
  component: FulfillmentPending,
});

/** Fulfillment processing screen. Polls until state changes. */
function FulfillmentPending() {
  const { id } = Route.useParams();
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const { pollFulfillment } = useOrderMutations();
  const [state, setState] = useState<FulfillmentStatus>("processing");

  useEffect(() => {
    const controller = new AbortController();
    const poll = async () => {
      const r = await pollFulfillment(id, controller.signal);
      if (controller.signal.aborted || !r.ok) return;
      if (r.data.state === "fulfilled") setState("fulfilled");
    };
    const t = setInterval(() => {
      void poll();
    }, 2000);
    return () => {
      controller.abort();
      clearInterval(t);
    };
  }, [id, pollFulfillment]);

  if (state === "fulfilled") {
    return (
      <StatusScreen
        tone="success"
        icon={<CheckCircle2 className="h-10 w-10" />}
        title={isAr ? "تم التسليم" : "Delivered"}
        message={isAr ? "طلبك جاهز الآن." : "Your order is ready."}
        primary={{ label: isAr ? "عرض الطلب" : "View order", to: `/order/${id}` }}
      />
    );
  }

  return (
    <StatusScreen
      tone="neutral"
      icon={<Loader2 className="h-10 w-10 animate-spin" />}
      title={isAr ? "تم استلام الدفع" : "Payment confirmed"}
      message={
        isAr
          ? "جاري تنفيذ طلبك. لا تُغلق التطبيق."
          : "We're fulfilling your order. Don't close the app."
      }
      secondary={{ label: isAr ? "الطلبات" : "My orders", to: "/orders" }}
    />
  );
}
