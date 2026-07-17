import { corsHeaders, jsonResponse, requireUser } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) return jsonResponse({ error: authError ?? "UNAUTHORIZED" }, 401);

  // Stub: supplier account lookup not connected.
  return jsonResponse({
    ok: false,
    reason: "temporarily_unavailable",
    message: {
      en: "Account lookup is temporarily unavailable.",
      ar: "التحقق من الحساب غير متاح مؤقتاً.",
    },
  });
});
