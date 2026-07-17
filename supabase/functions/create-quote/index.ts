import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const body = await req.json();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return jsonResponse({ error: "VALIDATION" }, 400);

  const admin = createServiceClient();
  const country = String(body.country ?? "SA");
  const paymentCurrency = String(body.paymentCurrency ?? "SAR");
  const displayCurrency = String(body.displayCurrency ?? paymentCurrency);
  const promoCode = body.promoCode ? String(body.promoCode) : null;
  const simulate = body.simulate as string | undefined;

  let subtotal = 0;
  let availability: "available" | "price_changed" | "product_unavailable" = "available";
  const warnings: unknown[] = [];
  const quoteItems: Record<string, unknown>[] = [];

  for (const item of items) {
    const productId = String(item.productId);
    const sku = String(item.sku);
    const quantity = Number(item.quantity ?? 1);
    const clientUnitPrice =
      item.clientUnitPrice != null ? Number(item.clientUnitPrice) : null;

    const { data: product } = await admin.from("products").select("*").eq("id", productId).maybeSingle();
    if (!product || !product.in_stock || simulate === "product_unavailable") {
      availability = "product_unavailable";
      warnings.push({
        kind: "product_unavailable",
        productId,
        message: { en: "Product unavailable", ar: "المنتج غير متاح" },
      });
      continue;
    }

    let unitPrice = Number(product.from_price);
    let available = true;
    const { data: den } = await admin
      .from("denominations")
      .select("*")
      .eq("id", sku)
      .maybeSingle();
    const { data: pkg } = await admin
      .from("topup_packages")
      .select("*")
      .eq("id", sku)
      .maybeSingle();
    if (den) {
      unitPrice = Number(den.price);
      available = den.in_stock;
    } else if (pkg) {
      unitPrice = Number(pkg.price);
      available = pkg.in_stock;
    }

    if (simulate === "price_changed" && clientUnitPrice != null) {
      unitPrice = clientUnitPrice + 1;
      availability = "price_changed";
      warnings.push({
        kind: "price_changed",
        productId,
        oldPrice: clientUnitPrice,
        newPrice: unitPrice,
        message: { en: "Price changed", ar: "تغير السعر" },
      });
    } else if (clientUnitPrice != null && Math.abs(clientUnitPrice - unitPrice) > 0.001) {
      availability = "price_changed";
      warnings.push({
        kind: "price_changed",
        productId,
        oldPrice: clientUnitPrice,
        newPrice: unitPrice,
        message: { en: "Price changed", ar: "تغير السعر" },
      });
    }

    if (!available) {
      availability = "product_unavailable";
      warnings.push({
        kind: "stock_changed",
        productId,
        message: { en: "Out of stock", ar: "غير متوفر" },
      });
    }

    const totalPrice = unitPrice * quantity;
    subtotal += totalPrice;
    quoteItems.push({
      product_id: productId,
      sku,
      title_en: product.title_en,
      title_ar: product.title_ar,
      quantity,
      unit_price: unitPrice,
      client_unit_price: clientUnitPrice,
      total_price: totalPrice,
      currency: paymentCurrency,
      region_code: product.region_code,
      region_label_en: product.region_code,
      region_label_ar: product.region_code,
      available,
      fulfillment_fields: item.fulfillmentFields ?? {},
    });
  }

  let discount = 0;
  if (promoCode) {
    const { data: promo } = await admin
      .from("promotions")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (promo) {
      discount = Math.round(subtotal * 0.1 * 100) / 100;
      warnings.push({
        kind: "promo_applied",
        code: promo.code,
        message: { en: promo.title_en, ar: promo.title_ar },
      });
    } else {
      warnings.push({
        kind: "promo_invalid",
        code: promoCode,
        message: { en: "Invalid promo", ar: "رمز غير صالح" },
      });
    }
  }

  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const fees = 0;
  const total = Math.max(0, subtotal - discount + tax + fees);
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();

  const { data: quote, error } = await admin
    .from("checkout_quotes")
    .insert({
      user_id: user.id,
      country,
      payment_currency: paymentCurrency,
      display_currency: displayCurrency,
      region_code: country,
      promo_code: promoCode,
      availability_status: availability,
      subtotal,
      discount,
      tax,
      fees,
      total,
      warnings,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !quote) return jsonResponse({ error: error?.message ?? "UNKNOWN" }, 500);

  if (quoteItems.length) {
    await admin.from("checkout_quote_items").insert(
      quoteItems.map((qi) => ({ ...qi, quote_id: quote.id })),
    );
  }

  await writeAudit(admin, user.id, "create_quote", "checkout_quote", quote.id, {
    total,
    availability,
  });

  return jsonResponse({ quoteId: quote.id });
});
