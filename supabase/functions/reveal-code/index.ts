import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "INVALID_JSON" }, 400);
  }

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

  // Fail closed: only server-issued, unused, unexpired reauth tokens are accepted.
  if (!reauth) {
    return jsonResponse({ error: "UNAUTHORIZED", message: "Valid reauth token required." }, 401);
  }

  await admin
    .from("reauth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", reauth.id);

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

  // Ciphertext is opaque until KMS encryption ships; decode only server-side.
  let code: string;
  try {
    code = atob(codeRow.code_ciphertext);
  } catch {
    return jsonResponse({ error: "code_unavailable" }, 404);
  }

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
