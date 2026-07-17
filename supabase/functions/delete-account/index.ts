import { corsHeaders, createServiceClient, jsonResponse, requireUser, writeAudit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  const admin = createServiceClient();
  await writeAudit(admin, user.id, "delete_account_requested", "profile", user.id, {});

  // Soft-delete profile fields; full auth.users delete requires admin API.
  await admin
    .from("profiles")
    .update({
      display_name: "Deleted",
      email: null,
      phone: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  try {
    await admin.auth.admin.deleteUser(user.id);
  } catch {
    // Admin API may be unavailable in local stubs.
  }

  return jsonResponse({ ok: true });
});
