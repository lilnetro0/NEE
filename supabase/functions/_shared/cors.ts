import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function requireUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) return { user: null, error: "UNAUTHORIZED" };
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { user: null, error: "UNAUTHORIZED" };
  return { user: data.user, error: null, userClient: client };
}

export async function writeAudit(
  admin: ReturnType<typeof createServiceClient>,
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  await admin.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });
}
