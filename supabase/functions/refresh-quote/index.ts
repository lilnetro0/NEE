import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const body = await req.json();
  const quoteId = String(body.quoteId ?? "");
  if (!quoteId) return jsonResponse({ error: "VALIDATION" }, 400);

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("checkout_quotes")
    .select("*, checkout_quote_items(*)")
    .eq("id", quoteId)
    .maybeSingle();

  if (!existing) return jsonResponse({ error: "not_found" }, 404);
  if (existing.user_id !== user.id) {
    return jsonResponse({ error: "FORBIDDEN", message: "Quote does not belong to this user." }, 403);
  }

  const items = (existing.checkout_quote_items ?? []).map((row: Record<string, unknown>) => ({
    productId: row.product_id,
    sku: row.sku,
    quantity: row.quantity,
    clientUnitPrice: row.client_unit_price,
    fulfillmentFields: row.fulfillment_fields,
  }));

  // Re-price via create-quote logic by forwarding
  const forward = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/create-quote`, {
    method: "POST",
    headers: {
      Authorization: req.headers.get("Authorization") ?? "",
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      country: existing.country,
      paymentCurrency: existing.payment_currency,
      displayCurrency: existing.display_currency,
      promoCode: existing.promo_code,
      simulate: body.simulate,
    }),
  });
  const payload = await forward.json();
  if (!forward.ok) return jsonResponse(payload, forward.status);
  await writeAudit(admin, user.id, "refresh_quote", "checkout_quote", payload.quoteId);
  return jsonResponse(payload);
});
