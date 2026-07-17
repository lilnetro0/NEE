import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const admin = createServiceClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return jsonResponse({ error: "FORBIDDEN" }, 403);

  const body = await req.json();
  const orderId = String(body.orderId ?? "");
  const action = String(body.action ?? "");
  if (!orderId || !action) return jsonResponse({ error: "VALIDATION" }, 400);

  await writeAudit(admin, user.id, `admin_${action}`, "order", orderId, body);

  if (action === "cancel") {
    await admin
      .from("orders")
      .update({ payment_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);
  } else if (action === "manual_review") {
    await admin
      .from("orders")
      .update({ fulfillment_status: "manual_review", updated_at: new Date().toISOString() })
      .eq("id", orderId);
  } else {
    return jsonResponse({ error: "UNKNOWN_ACTION" }, 400);
  }

  return jsonResponse({ ok: true });
});
