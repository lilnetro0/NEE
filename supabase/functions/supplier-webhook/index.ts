/**
 * Generic supplier webhook inbox — no provider-specific parsing.
 * Idempotent on (supplier_id, provider_event_id) when both present.
 */
import { buildCorsHeaders, createServiceClient, jsonResponse, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405, req);
  }

  const supplierCode = req.headers.get("x-netro-supplier") ?? "";
  const webhookSecret = req.headers.get("x-netro-webhook-secret") ?? "";
  const expected = Deno.env.get("SUPPLIER_WEBHOOK_SHARED_SECRET") ?? "";

  // Fail closed when secret is configured; allow receive-only logging when unset in staging.
  if (expected && webhookSecret !== expected) {
    return jsonResponse({ error: "UNAUTHORIZED" }, 401, req);
  }

  const admin = createServiceClient();
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let supplierId: string | null = null;
  if (supplierCode) {
    const { data } = await admin.from("suppliers").select("id").eq("code", supplierCode).maybeSingle();
    supplierId = data?.id ?? null;
  }

  const eventType = String(body.eventType ?? body.type ?? "unknown");
  const providerEventId =
    typeof body.eventId === "string"
      ? body.eventId
      : typeof body.id === "string"
        ? body.id
        : null;

  // Scrub obvious secrets from stored payload
  const scrubbed = { ...body };
  for (const key of Object.keys(scrubbed)) {
    if (/token|secret|password|authorization|code|pin|key/i.test(key)) {
      scrubbed[key] = "[redacted]";
    }
  }

  const { data, error } = await admin
    .from("supplier_webhook_events")
    .insert({
      supplier_id: supplierId,
      event_type: eventType,
      provider_event_id: providerEventId,
      payload: scrubbed,
      status: "received",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return jsonResponse({ ok: true, duplicate: true }, 200, req);
    }
    return jsonResponse({ error: error.message }, 400, req);
  }

  await writeAudit(admin, null, "supplier_webhook_received", "supplier_webhook_event", data?.id, {
    supplierCode: supplierCode || null,
    eventType,
  });

  return jsonResponse({ ok: true, id: data?.id }, 200, req);
});
