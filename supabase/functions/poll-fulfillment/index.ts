import { corsHeaders, createServiceClient, jsonResponse, requireUser } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const body = await req.json().catch(() => ({}));
  const orderId = String((body as { orderId?: string }).orderId ?? "");
  if (!orderId) return jsonResponse({ error: "VALIDATION" }, 400);

  const admin = createServiceClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id,user_id,fulfillment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!order || order.user_id !== user.id) return jsonResponse({ error: "NOT_FOUND" }, 404);

  return jsonResponse({ state: order.fulfillment_status });
});
