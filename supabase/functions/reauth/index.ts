import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const admin = createServiceClient();
  const token = crypto.randomUUID();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hashHex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

  await admin.from("reauth_tokens").insert({
    user_id: user.id,
    token_hash: hashHex,
    expires_at: expiresAt,
  });
  await writeAudit(admin, user.id, "reauth_issued", "reauth_token", undefined, {});

  return jsonResponse({ token, expiresAt });
});
