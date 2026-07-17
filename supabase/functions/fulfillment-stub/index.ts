/**
 * EXPLICIT FULFILLMENT STUB — NOT PRODUCTION.
 * Runs only after payment_status = paid.
 * Writes codes into digital_codes (ciphertext). Never returns codes to the client.
 */
import { corsHeaders, createServiceClient, jsonResponse, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json();
  const orderId = String(body.orderId ?? "");
  const internal = body.internal === true;
  if (!orderId) return jsonResponse({ error: "VALIDATION" }, 400);

  // Internal calls use service role; external must be disabled unless stub enabled.
  if (!internal && Deno.env.get("FULFILLMENT_STUB_ENABLED") !== "true") {
    return jsonResponse({ error: "FULFILLMENT_STUB_DISABLED" }, 403);
  }

  const admin = createServiceClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return jsonResponse({ error: "not_found" }, 404);
  if (order.payment_status !== "paid") {
    return jsonResponse({ error: "payment_not_paid" }, 409);
  }

  await admin
    .from("orders")
    .update({ fulfillment_status: "processing", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  const { data: items } = await admin.from("order_items").select("*").eq("order_id", orderId);
  for (const item of items ?? []) {
    await admin.from("fulfillment_attempts").insert({
      order_id: orderId,
      order_item_id: item.id,
      status: "processing",
      provider: "stub",
      provider_ref: `stub_ff_${crypto.randomUUID()}`,
    });

    if (item.kind === "gift_card") {
      const fakeCode = `STUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      // Store as opaque ciphertext placeholder (real impl encrypts with KMS).
      await admin.from("digital_codes").insert({
        order_item_id: item.id,
        code_ciphertext: btoa(fakeCode),
      });
    }
  }

  await admin
    .from("orders")
    .update({ fulfillment_status: "fulfilled", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  await admin.from("order_status_events").insert({
    order_id: orderId,
    payment_status: "paid",
    fulfillment_status: "fulfilled",
    note: "Fulfillment stub completed (NOT production supplier)",
    actor: "fulfillment-stub",
  });

  await writeAudit(admin, order.user_id, "fulfillment_stub", "order", orderId, { stub: true });
  return jsonResponse({ ok: true, orderId, fulfillment_status: "fulfilled", stub: true });
});
