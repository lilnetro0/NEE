/**
 * Payment webhook skeleton (Moyasar-ready).
 * ONLY a verified provider callback may set payment_status = paid in production.
 * Stub simulation requires PAYMENT_STUB_ENABLED and service-role Authorization.
 */
import { corsHeaders, createServiceClient, jsonResponse, writeAudit } from "../_shared/cors.ts";

function isServiceRoleRequest(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return Boolean(serviceKey) && auth === `Bearer ${serviceKey}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "INVALID_JSON" }, 400);
  }

  const admin = createServiceClient();

  // Stub simulate path — non-production only, service-role callers only.
  if (body.stubSimulatePaid === true) {
    if (Deno.env.get("PAYMENT_STUB_ENABLED") !== "true") {
      return jsonResponse(
        {
          error: "PAYMENT_STUB_DISABLED",
          message: "Payment stub is disabled. Use a verified provider webhook in production.",
        },
        403,
      );
    }
    if (!isServiceRoleRequest(req)) {
      return jsonResponse({ error: "FORBIDDEN", message: "Stub payment requires service role." }, 403);
    }

    const orderId = String(body.orderId ?? "");
    const idempotencyKey = `stub-paid:${orderId}`;
    const { data: existing } = await admin
      .from("idempotency_keys")
      .select("*")
      .eq("key", idempotencyKey)
      .maybeSingle();
    if (existing?.response) return jsonResponse(existing.response);

    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return jsonResponse({ error: "not_found" }, 404);

    await admin
      .from("orders")
      .update({
        payment_status: "paid",
        fulfillment_status: "fulfillment_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    await admin.from("order_status_events").insert({
      order_id: orderId,
      payment_status: "paid",
      fulfillment_status: "fulfillment_pending",
      note: "Stub webhook marked paid (NOT production)",
      actor: "payment-webhook-stub",
    });

    if (Deno.env.get("FULFILLMENT_STUB_ENABLED") === "true") {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/fulfillment-stub`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
    }

    const response = { ok: true, orderId, payment_status: "paid", stub: true };
    await admin.from("idempotency_keys").insert({
      key: idempotencyKey,
      user_id: order.user_id,
      scope: "payment-webhook",
      response,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
    });
    await writeAudit(admin, order.user_id, "payment_paid_stub", "order", orderId, {});
    return jsonResponse(response);
  }

  // Moyasar (or other) verified webhook — implement signature verification here.
  return jsonResponse(
    {
      error: "NOT_IMPLEMENTED",
      message:
        "Provider webhook verification is not wired yet. Rejecting unverified payment events.",
    },
    501,
  );
});
