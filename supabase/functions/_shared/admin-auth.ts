import type { createServiceClient } from "./cors.ts";

export type AdminPermission =
  | "dashboard.read"
  | "catalog.read"
  | "catalog.write"
  | "suppliers.read"
  | "suppliers.write"
  | "orders.read"
  | "orders.write"
  | "users.read"
  | "users.write"
  | "support.read"
  | "support.write"
  | "notifications.write"
  | "settings.read"
  | "settings.write"
  | "audit.read"
  | "roles.read"
  | "roles.write";

export type AdminContext = {
  userId: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: Set<AdminPermission>;
};

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * profiles.is_admin => Super Admin shortcut (full permissions).
 * Otherwise permissions come from admin_user_roles + admin_role_permissions.
 */
export async function loadAdminContext(
  admin: ServiceClient,
  userId: string,
): Promise<AdminContext | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;
  if (profile.account_status === "suspended" || profile.account_status === "banned") {
    return null;
  }

  if (profile.is_admin) {
    return {
      userId,
      isSuperAdmin: true,
      roles: ["super_admin"],
      permissions: new Set([
        "dashboard.read",
        "catalog.read",
        "catalog.write",
        "suppliers.read",
        "suppliers.write",
        "orders.read",
        "orders.write",
        "users.read",
        "users.write",
        "support.read",
        "support.write",
        "notifications.write",
        "settings.read",
        "settings.write",
        "audit.read",
        "roles.read",
        "roles.write",
      ]),
    };
  }

  const { data: roleRows } = await admin
    .from("admin_user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roles = (roleRows ?? []).map((r) => r.role_id as string);
  if (!roles.length) return null;

  const { data: permRows } = await admin
    .from("admin_role_permissions")
    .select("permission")
    .in("role_id", roles);

  const permissions = new Set<AdminPermission>();
  for (const row of permRows ?? []) {
    permissions.add(row.permission as AdminPermission);
  }

  return {
    userId,
    isSuperAdmin: roles.includes("super_admin"),
    roles,
    permissions,
  };
}

export function requirePermission(ctx: AdminContext, permission: AdminPermission): boolean {
  return ctx.permissions.has(permission);
}
