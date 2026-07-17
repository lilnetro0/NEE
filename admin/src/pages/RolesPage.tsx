import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, PageHeader } from "@/components/ui";

const ALL_PERMISSIONS = [
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
];

export function RolesPage() {
  const { can } = useAuth();
  const [roles, setRoles] = useState<Array<{ id: string; name_en: string }>>([]);
  const [permissions, setPermissions] = useState<Array<{ role_id: string; permission: string }>>(
    [],
  );
  const [selected, setSelected] = useState("admin");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    void adminApi<{
      roles: Array<{ id: string; name_en: string }>;
      permissions: Array<{ role_id: string; permission: string }>;
    }>("roles", "list")
      .then((res) => {
        setRoles(res.roles);
        setPermissions(res.permissions);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed"));

  useEffect(load, []);

  const selectedPerms = useMemo(
    () => new Set(permissions.filter((p) => p.role_id === selected).map((p) => p.permission)),
    [permissions, selected],
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Roles & permissions" subtitle="Granular RBAC matrix" />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            className={`btn ${selected === role.id ? "" : "btn-secondary"}`}
            onClick={() => setSelected(role.id)}
          >
            {role.name_en}
          </button>
        ))}
      </div>
      <div className="card grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_PERMISSIONS.map((permission) => (
          <label key={permission} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedPerms.has(permission)}
              disabled={!can("roles.write") || selected === "super_admin"}
              onChange={(e) => {
                setPermissions((prev) => {
                  const without = prev.filter(
                    (p) => !(p.role_id === selected && p.permission === permission),
                  );
                  return e.target.checked
                    ? [...without, { role_id: selected, permission }]
                    : without;
                });
              }}
            />
            {permission}
          </label>
        ))}
      </div>
      {can("roles.write") && selected !== "super_admin" ? (
        <button
          type="button"
          className="btn"
          onClick={() =>
            void adminApi("roles", "setRolePermissions", {
              roleId: selected,
              permissions: [...selectedPerms],
            }).then(load)
          }
        >
          Save role permissions
        </button>
      ) : null}
    </div>
  );
}
