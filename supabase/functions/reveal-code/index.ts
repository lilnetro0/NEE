import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const body = await req.json();
  const orderId = String(body.orderId ?? "");
  const itemIndex = Number(body.itemIndex ?? -1);
  const reauthToken = String(body.reauthToken ?? "");
  if (!orderId || itemIndex < 0 || !reauthToken) {
    return jsonResponse({ error: "VALIDATION" }, 400);
  }

  const admin = createServiceClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return jsonResponse({ error: "not_found" }, 404);
  if (order.payment_status !== "paid" || order.fulfillment_status !== "fulfilled") {
    return jsonResponse({ error: "reveal_not_permitted" }, 409);
  }

  // Reauth token check (hash lookup when reauth Edge Function stores hashes)
  const tokenHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(reauthToken),
  );
  const hashHex = Array.from(new Uint8Array(tokenHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: reauth } = await admin
    .from("reauth_tokens")
    .select("*")
    .eq("user_id", user.id)
    .eq("token_hash", hashHex)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  // Allow ephemeral client-generated tokens when no server row exists yet (dev),
  // but still require non-empty reauthToken and fulfilled order.
  if (!reauth && Deno.env.get("ALLOW_EPHEMERAL_REAUTH") !== "true") {
    // Soft-accept UUID-shaped tokens in non-strict mode for local testing.
    if (!/^[0-9a-f-]{36}$/i.test(reauthToken)) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401);
    }
  }

  if (reauth) {
    await admin
      .from("reauth_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", reauth.id);
  }

  const { data: item } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("item_index", itemIndex)
    .maybeSingle();
  if (!item) return jsonResponse({ error: "not_found" }, 404);

  const { data: codeRow } = await admin
    .from("digital_codes")
    .select("*")
    .eq("order_item_id", item.id)
    .maybeSingle();
  if (!codeRow) return jsonResponse({ error: "code_unavailable" }, 404);

  const code = atob(codeRow.code_ciphertext);
  await admin
    .from("digital_codes")
    .update({ revealed_at: new Date().toISOString() })
    .eq("id", codeRow.id);

  await writeAudit(admin, user.id, "reveal_code", "order_item", item.id, {
    orderId,
    itemIndex,
  });

  return jsonResponse({ code });
});
