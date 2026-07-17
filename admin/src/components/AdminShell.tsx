import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

const NAV: { to: string; label: string; permission?: string }[] = [
  { to: "/", label: "Dashboard", permission: "dashboard.read" },
  { to: "/products", label: "Products", permission: "catalog.read" },
  { to: "/categories", label: "Categories", permission: "catalog.read" },
  { to: "/suppliers", label: "Suppliers", permission: "suppliers.read" },
  { to: "/orders", label: "Orders", permission: "orders.read" },
  { to: "/users", label: "Users", permission: "users.read" },
  { to: "/support", label: "Support", permission: "support.read" },
  { to: "/notifications", label: "Notifications", permission: "notifications.write" },
  { to: "/settings", label: "Settings", permission: "settings.read" },
  { to: "/audit", label: "Audit", permission: "audit.read" },
  { to: "/roles", label: "Roles", permission: "roles.read" },
];

export function AdminShell() {
  const { me, signOut, can } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 p-4">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">NETRO</div>
          <div className="font-black text-xl">Admin</div>
          <div className="mt-1 text-xs text-slate-400">{me?.roles.join(", ")}</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.filter((item) => !item.permission || can(item.permission)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn btn-secondary mt-4" onClick={() => void signOut()}>
          Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
