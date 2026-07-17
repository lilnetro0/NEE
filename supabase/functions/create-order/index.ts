import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  if (Deno.env.get("COMMERCE_CHECKOUT_ENABLED") !== "true") {
    return jsonResponse(
      {
        error: "PURCHASING_DISABLED",
        message: "Order creation is disabled until payment provider integration is enabled.",
      },
      403,
    );
  }

  const body = await req.json();
  const quoteId = String(body.quoteId ?? "");
  const paymentMethod = String(body.paymentMethod ?? "card");
  const idempotencyKey = String(body.idempotencyKey ?? "");
  if (!quoteId || !idempotencyKey) return jsonResponse({ error: "VALIDATION" }, 400);

  const admin = createServiceClient();

  const { data: existingKey } = await admin
    .from("idempotency_keys")
    .select("*")
    .eq("key", idempotencyKey)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingKey?.response) {
    return jsonResponse(existingKey.response);
  }

  const { data: quote } = await admin.from("checkout_quotes").select("*").eq("id", quoteId).maybeSingle();
  if (!quote) return jsonResponse({ error: "not_found" }, 404);
  if (quote.user_id !== user.id) {
    return jsonResponse({ error: "FORBIDDEN", message: "Quote does not belong to this user." }, 403);
  }
  if (Date.parse(quote.expires_at) <= Date.now() || quote.availability_status !== "available") {
    return jsonResponse({ error: "quote_unavailable" }, 409);
  }

  const { data: qItems } = await admin
    .from("checkout_quote_items")
    .select("*")
    .eq("quote_id", quoteId);

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      quote_id: quoteId,
      payment_status: "pending_payment",
      fulfillment_status: "not_started",
      refund_status: "none",
      payment_method: paymentMethod,
      payment_currency: quote.payment_currency,
      display_currency: quote.display_currency,
      country: quote.country,
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      fees: quote.fees,
      total: quote.total,
      idempotency_key: idempotencyKey,
    })
    .select("*")
    .single();

  if (error || !order) return jsonResponse({ error: error?.message ?? "UNKNOWN" }, 500);

  const kindByProduct = new Map<string, string>();
  for (const item of qItems ?? []) {
    const { data: product } = await admin.from("products").select("kind").eq("id", item.product_id).maybeSingle();
    kindByProduct.set(item.product_id, product?.kind ?? "gift_card");
  }

  await admin.from("order_items").insert(
    (qItems ?? []).map((item: Record<string, unknown>, index: number) => ({
      order_id: order.id,
      item_index: index,
      product_id: item.product_id,
      kind: kindByProduct.get(String(item.product_id)) ?? "gift_card",
      sku: item.sku,
      title_en: item.title_en,
      title_ar: item.title_ar,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      currency: item.currency,
      fulfillment_fields: item.fulfillment_fields ?? {},
    })),
  );

  await admin.from("order_status_events").insert({
    order_id: order.id,
    payment_status: "pending_payment",
    fulfillment_status: "not_started",
    note: "Order created; awaiting verified payment",
    actor: "create-order",
  });

  const response = { orderId: order.id };
  await admin.from("idempotency_keys").insert({
    key: idempotencyKey,
    user_id: user.id,
    scope: "create-order",
    response,
    expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
  });

  await writeAudit(admin, user.id, "create_order", "order", order.id, {
    quoteId,
    total: order.total,
  });

  // Explicit payment stub path — does NOT mark paid.
  // Clients may call payment-stub-initiate separately in non-production.
  return jsonResponse(response);
});
