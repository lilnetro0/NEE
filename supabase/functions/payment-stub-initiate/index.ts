/**
 * EXPLICIT PAYMENT STUB — NOT PRODUCTION.
 * Creates a payment_session in payment_processing.
 * Does NOT set orders.payment_status = paid.
 * Paid transitions happen only in payment-webhook after verification.
 * Set PAYMENT_STUB_ENABLED=true in non-prod; production must refuse.
 */
import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (Deno.env.get("PAYMENT_STUB_ENABLED") !== "true") {
    return jsonResponse(
      {
        error: "PAYMENT_STUB_DISABLED",
        message: "Payment stub is disabled. Use Moyasar webhook flow in production.",
      },
      403,
    );
  }

  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const body = await req.json();
  const orderId = String(body.orderId ?? "");
  if (!orderId) return jsonResponse({ error: "VALIDATION" }, 400);

  const admin = createServiceClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return jsonResponse({ error: "not_found" }, 404);

  await admin
    .from("orders")
    .update({ payment_status: "payment_processing", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  const { data: session, error } = await admin
    .from("payment_sessions")
    .insert({
      order_id: orderId,
      provider: "stub",
      provider_ref: `stub_${crypto.randomUUID()}`,
      status: "payment_processing",
      amount: order.total,
      currency: order.payment_currency,
      metadata: { stub: true, warning: "NOT_PRODUCTION" },
    })
    .select("*")
    .single();

  if (error || !session) return jsonResponse({ error: error?.message ?? "UNKNOWN" }, 500);

  await admin.from("payment_events").insert({
    payment_session_id: session.id,
    event_type: "stub_initiated",
    payload: { note: "Awaiting payment-webhook for paid transition" },
  });

  await writeAudit(admin, user.id, "payment_stub_initiate", "order", orderId, {
    sessionId: session.id,
  });

  return jsonResponse({
    paymentSessionId: session.id,
    status: "payment_processing",
    stub: true,
    next: "Call payment-webhook with stubSimulatePaid=true only in non-prod test harnesses",
  });
});
