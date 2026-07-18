/**
 * Privileged Admin API — single Edge entry for Admin SPA.
 * Body: { resource, action, payload? }
 * Auth: Bearer JWT + RBAC (profiles.is_admin or admin_user_roles).
 * Never exposes supplier credentials plaintext.
 */
import {
  buildCorsHeaders,
  createServiceClient,
  jsonResponse,
  requireUser,
  writeAudit,
} from "../_shared/cors.ts";
import {
  loadAdminContext,
  requirePermission,
  type AdminContext,
  type AdminPermission,
} from "../_shared/admin-auth.ts";
import { resolveSupplierMappings } from "../_shared/suppliers/index.ts";

type ServiceClient = ReturnType<typeof createServiceClient>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCorsHeaders(req) });
  }

  try {
    const { user, error: authError } = await requireUser(req);
    if (authError || !user) return jsonResponse({ error: "UNAUTHORIZED" }, 401, req);

    const admin = createServiceClient();
    const ctx = await loadAdminContext(admin, user.id);
    if (!ctx) return jsonResponse({ error: "FORBIDDEN" }, 403, req);

    const body = await req.json().catch(() => ({}));
    const resource = String(body.resource ?? "");
    const action = String(body.action ?? "");
    const payload = (body.payload ?? {}) as Record<string, unknown>;

    if (!resource || !action) {
      return jsonResponse({ error: "VALIDATION", message: "resource and action required" }, 400, req);
    }

    const result = await route(admin, ctx, resource, action, payload, req);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL";
    return jsonResponse({ error: "INTERNAL", message }, 500, req);
  }
});

async function route(
  admin: ServiceClient,
  ctx: AdminContext,
  resource: string,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
): Promise<Response> {
  switch (resource) {
    case "me":
      return handleMe(ctx, req);
    case "dashboard":
      return handleDashboard(admin, ctx, action, req);
    case "catalog":
      return handleCatalog(admin, ctx, action, payload, req);
    case "suppliers":
      return handleSuppliers(admin, ctx, action, payload, req);
    case "orders":
      return handleOrders(admin, ctx, action, payload, req);
    case "users":
      return handleUsers(admin, ctx, action, payload, req);
    case "support":
      return handleSupport(admin, ctx, action, payload, req);
    case "notifications":
      return handleNotifications(admin, ctx, action, payload, req);
    case "settings":
      return handleSettings(admin, ctx, action, payload, req);
    case "audit":
      return handleAudit(admin, ctx, action, payload, req);
    case "roles":
      return handleRoles(admin, ctx, action, payload, req);
    default:
      return jsonResponse({ error: "UNKNOWN_RESOURCE" }, 400, req);
  }
}

function deny(req: Request, permission: AdminPermission) {
  return jsonResponse({ error: "FORBIDDEN", permission }, 403, req);
}

function handleMe(ctx: AdminContext, req: Request) {
  return jsonResponse(
    {
      userId: ctx.userId,
      isSuperAdmin: ctx.isSuperAdmin,
      roles: ctx.roles,
      permissions: [...ctx.permissions],
    },
    200,
    req,
  );
}

async function handleDashboard(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  req: Request,
) {
  if (action !== "stats") return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  if (!requirePermission(ctx, "dashboard.read")) return deny(req, "dashboard.read");

  const [
    users,
    activeUsers,
    orders,
    pendingOrders,
    failedOrders,
    products,
    categories,
    tickets,
    settings,
    recentAudit,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "active"),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["pending_payment", "payment_processing"]),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .or("payment_status.eq.failed,fulfillment_status.eq.failed"),
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_archived", false),
    admin.from("categories").select("id", { count: "exact", head: true }),
    admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress", "waiting_for_customer"]),
    admin.from("app_settings").select("key,value"),
    admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const settingsMap: Record<string, unknown> = {};
  for (const row of settings.data ?? []) {
    settingsMap[row.key] = row.value;
  }

  return jsonResponse(
    {
      totals: {
        users: users.count ?? 0,
        activeUsers: activeUsers.count ?? 0,
        orders: orders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        failedOrders: failedOrders.count ?? 0,
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        openTickets: tickets.count ?? 0,
        revenuePlaceholder: null,
      },
      systemStatus: {
        maintenanceMode: settingsMap.maintenance_mode === true,
        purchasingEnabled: settingsMap.purchasing_enabled === true,
        externalPaymentsEnabled: settingsMap.external_payments_enabled === true,
      },
      recentActivity: recentAudit.data ?? [],
    },
    200,
    req,
  );
}

async function handleCatalog(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  const read = () => requirePermission(ctx, "catalog.read");
  const write = () => requirePermission(ctx, "catalog.write");

  switch (action) {
    case "listProducts": {
      if (!read()) return deny(req, "catalog.read");
      const { data, error } = await admin
        .from("products")
        .select("*")
        .order("sort_order")
        .order("id")
        .limit(Number(payload.limit ?? 200));
      if (error) return jsonResponse({ error: error.message }, 400, req);
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "getProduct": {
      if (!read()) return deny(req, "catalog.read");
      const id = String(payload.id ?? "");
      const { data: product } = await admin.from("products").select("*").eq("id", id).maybeSingle();
      if (!product) return jsonResponse({ error: "NOT_FOUND" }, 404, req);
      const [{ data: dens }, { data: pkgs }, { data: fields }] = await Promise.all([
        admin.from("denominations").select("*").eq("product_id", id).order("sort_order"),
        admin.from("topup_packages").select("*").eq("product_id", id).order("sort_order"),
        admin.from("product_required_fields").select("*").eq("product_id", id),
      ]);
      return jsonResponse(
        { product, denominations: dens ?? [], packages: pkgs ?? [], requiredFields: fields ?? [] },
        200,
        req,
      );
    }
    case "upsertProduct": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.product as Record<string, unknown>;
      if (!row?.id) return jsonResponse({ error: "VALIDATION" }, 400, req);
      if (!row.brand_id || !row.category_id || !row.kind) {
        return jsonResponse(
          { error: "VALIDATION", message: "Brand, category, and product kind are required." },
          400,
          req,
        );
      }
      const regionId = String(row.region_id ?? row.region_code ?? "GLOBAL").toUpperCase();
      row.region_id = regionId === "KSA" ? "SA" : regionId;
      // Keep the legacy column populated during the dual-read window.
      row.region_code = row.region_id;
      const { error } = await admin.from("products").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_product", "product", String(row.id), {
        keys: Object.keys(row),
      });
      return jsonResponse({ ok: true }, 200, req);
    }
    case "archiveProduct": {
      if (!write()) return deny(req, "catalog.write");
      const id = String(payload.id ?? "");
      await admin.from("products").update({ is_archived: true, is_visible: false }).eq("id", id);
      await writeAudit(admin, ctx.userId, "admin_archive_product", "product", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deleteProduct": {
      if (!write()) return deny(req, "catalog.write");
      const id = String(payload.id ?? "");
      const { error } = await admin.from("products").delete().eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_delete_product", "product", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "upsertDenomination": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.denomination as Record<string, unknown>;
      const { error } = await admin.from("denominations").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_denomination", "denomination", String(row.id));
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deleteDenomination": {
      if (!write()) return deny(req, "catalog.write");
      const id = String(payload.id ?? "");
      await admin.from("denominations").delete().eq("id", id);
      await writeAudit(admin, ctx.userId, "admin_delete_denomination", "denomination", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "upsertPackage": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.package as Record<string, unknown>;
      const { error } = await admin.from("topup_packages").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_package", "topup_package", String(row.id));
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deletePackage": {
      if (!write()) return deny(req, "catalog.write");
      const id = String(payload.id ?? "");
      await admin.from("topup_packages").delete().eq("id", id);
      await writeAudit(admin, ctx.userId, "admin_delete_package", "topup_package", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "upsertRequiredField": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.field as Record<string, unknown>;
      if (!row.product_id || !row.field_key || !row.field_schema) {
        return jsonResponse({ error: "VALIDATION" }, 400, req);
      }
      const { error } = await admin
        .from("product_required_fields")
        .upsert(row, { onConflict: "product_id,field_key" });
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(
        admin,
        ctx.userId,
        "admin_upsert_required_field",
        "product_required_field",
        `${String(row.product_id)}:${String(row.field_key)}`,
      );
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deleteRequiredField": {
      if (!write()) return deny(req, "catalog.write");
      const productId = String(payload.productId ?? "");
      const fieldKey = String(payload.fieldKey ?? "");
      const { error } = await admin
        .from("product_required_fields")
        .delete()
        .eq("product_id", productId)
        .eq("field_key", fieldKey);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(
        admin,
        ctx.userId,
        "admin_delete_required_field",
        "product_required_field",
        `${productId}:${fieldKey}`,
      );
      return jsonResponse({ ok: true }, 200, req);
    }
    case "listCategories": {
      if (!read()) return deny(req, "catalog.read");
      const { data } = await admin.from("categories").select("*").order("sort_order");
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "upsertCategory": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.category as Record<string, unknown>;
      const { error } = await admin.from("categories").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_category", "category", String(row.id));
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deleteCategory": {
      if (!write()) return deny(req, "catalog.write");
      const id = String(payload.id ?? "");
      const { error } = await admin.from("categories").delete().eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_delete_category", "category", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "listBrands": {
      if (!read()) return deny(req, "catalog.read");
      const { data } = await admin.from("brands").select("*").order("name_en");
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "getBrand": {
      if (!read()) return deny(req, "catalog.read");
      const id = String(payload.id ?? "");
      const [{ data: brand, error }, { data: offerings }] = await Promise.all([
        admin.from("brands").select("*").eq("id", id).maybeSingle(),
        admin
          .from("products")
          .select("*")
          .eq("brand_id", id)
          .order("region_id")
          .order("kind"),
      ]);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      return jsonResponse({ brand, offerings: offerings ?? [] }, 200, req);
    }
    case "upsertBrand": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.brand as Record<string, unknown>;
      const { error } = await admin.from("brands").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_brand", "brand", String(row.id));
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deleteBrand": {
      if (!write()) return deny(req, "catalog.write");
      const id = String(payload.id ?? "");
      const { error } = await admin.from("brands").delete().eq("id", id);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_delete_brand", "brand", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "listRegions": {
      if (!read()) return deny(req, "catalog.read");
      const { data, error } = await admin.from("regions").select("*").order("sort_order");
      if (error) return jsonResponse({ error: error.message }, 400, req);
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "upsertRegion": {
      if (!write()) return deny(req, "catalog.write");
      const row = payload.region as Record<string, unknown>;
      const code = String(row.code ?? "").toUpperCase();
      if (!code || !row.name_en || !row.name_ar) {
        return jsonResponse({ error: "VALIDATION", message: "Region names are required." }, 400, req);
      }
      const { error } = await admin.from("regions").upsert({ ...row, code });
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_region", "region", code);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "listVariants": {
      if (!read()) return deny(req, "catalog.read");
      const productId = payload.productId ? String(payload.productId) : null;
      let q = admin.from("admin_product_variants").select("*");
      if (productId) q = q.eq("product_id", productId);
      const { data, error } = await q.order("sort_order");
      if (error) return jsonResponse({ error: error.message }, 400, req);
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}

async function handleSuppliers(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  const read = () => requirePermission(ctx, "suppliers.read");
  const write = () => requirePermission(ctx, "suppliers.write");

  switch (action) {
    case "list": {
      if (!read()) return deny(req, "suppliers.read");
      const { data } = await admin
        .from("suppliers")
        .select(
          "id,code,name,priority,is_active,adapter_code,metadata,credentials_secret_id,created_at,updated_at",
        )
        .order("priority");
      const items = (data ?? []).map((s) => ({
        ...s,
        credentialsConfigured: Boolean(s.credentials_secret_id),
        credentials_secret_id: undefined,
      }));
      return jsonResponse({ items }, 200, req);
    }
    case "upsert": {
      if (!write()) return deny(req, "suppliers.write");
      const row = { ...(payload.supplier as Record<string, unknown>) };
      delete row.credentialsConfigured;
      // Never accept raw credential blobs from client
      delete row.credentials;
      delete row.api_key;
      delete row.secret;
      if (payload.credentialsSecretId !== undefined) {
        row.credentials_secret_id = payload.credentialsSecretId
          ? String(payload.credentialsSecretId)
          : null;
      }
      row.updated_at = new Date().toISOString();
      const { data, error } = await admin.from("suppliers").upsert(row).select("id").maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(admin, ctx.userId, "admin_upsert_supplier", "supplier", data?.id ?? null, {
        code: row.code,
      });
      return jsonResponse({ ok: true, id: data?.id }, 200, req);
    }
    case "listProducts": {
      if (!read()) return deny(req, "suppliers.read");
      const supplierId = String(payload.supplierId ?? "");
      const { data } = await admin
        .from("supplier_products")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false });
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "upsertProduct": {
      if (!write()) return deny(req, "suppliers.write");
      const row = payload.supplierProduct as Record<string, unknown>;
      row.updated_at = new Date().toISOString();
      const { error } = await admin.from("supplier_products").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(
        admin,
        ctx.userId,
        "admin_upsert_supplier_product",
        "supplier_product",
        String(row.id ?? row.supplier_product_id),
      );
      return jsonResponse({ ok: true }, 200, req);
    }
    case "listMappings": {
      if (!read()) return deny(req, "suppliers.read");
      let q = admin.from("supplier_product_mappings").select("*, suppliers(code,adapter_code,name)");
      if (payload.productId) q = q.eq("product_id", String(payload.productId));
      if (payload.sku) q = q.eq("sku", String(payload.sku));
      const { data } = await q.order("priority");
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "upsertMapping": {
      if (!write()) return deny(req, "suppliers.write");
      const row = payload.mapping as Record<string, unknown>;
      row.updated_at = new Date().toISOString();
      const { error } = await admin.from("supplier_product_mappings").upsert(row);
      if (error) return jsonResponse({ error: error.message }, 400, req);
      await writeAudit(
        admin,
        ctx.userId,
        "admin_upsert_supplier_mapping",
        "supplier_mapping",
        String(row.id ?? ""),
        { productId: row.product_id, sku: row.sku },
      );
      return jsonResponse({ ok: true }, 200, req);
    }
    case "deleteMapping": {
      if (!write()) return deny(req, "suppliers.write");
      const id = String(payload.id ?? "");
      await admin.from("supplier_product_mappings").delete().eq("id", id);
      await writeAudit(admin, ctx.userId, "admin_delete_supplier_mapping", "supplier_mapping", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "resolveRouting": {
      if (!read()) return deny(req, "suppliers.read");
      const productId = String(payload.productId ?? "");
      const sku = String(payload.sku ?? "");
      const { data } = await admin
        .from("supplier_product_mappings")
        .select("*, suppliers(adapter_code)")
        .eq("product_id", productId)
        .eq("sku", sku);
      const rows = (data ?? []).map((m) => ({
        id: m.id,
        supplier_id: m.supplier_id,
        supplier_product_ref: m.supplier_product_ref,
        supplier_sku: m.supplier_sku,
        supplier_cost: m.supplier_cost,
        currency: m.currency,
        country: m.country,
        priority: m.priority,
        is_active: m.is_active,
        adapter_code: (m.suppliers as { adapter_code?: string } | null)?.adapter_code,
      }));
      return jsonResponse({ items: resolveSupplierMappings(rows) }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}

async function handleOrders(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  const read = () => requirePermission(ctx, "orders.read");
  const write = () => requirePermission(ctx, "orders.write");

  switch (action) {
    case "list": {
      if (!read()) return deny(req, "orders.read");
      let q = admin.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (payload.paymentStatus) q = q.eq("payment_status", String(payload.paymentStatus));
      if (payload.fulfillmentStatus) {
        q = q.eq("fulfillment_status", String(payload.fulfillmentStatus));
      }
      if (payload.userId) q = q.eq("user_id", String(payload.userId));
      if (payload.q) {
        const term = String(payload.q);
        q = q.or(`id.eq.${term},idempotency_key.ilike.%${term}%`);
      }
      const { data, error } = await q;
      if (error) return jsonResponse({ error: error.message }, 400, req);
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "get": {
      if (!read()) return deny(req, "orders.read");
      const id = String(payload.id ?? "");
      const { data: order } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
      if (!order) return jsonResponse({ error: "NOT_FOUND" }, 404, req);
      const [{ data: items }, { data: events }, { data: attempts }, { data: profile }] =
        await Promise.all([
          admin.from("order_items").select("*").eq("order_id", id).order("item_index"),
          admin.from("order_status_events").select("*").eq("order_id", id).order("created_at"),
          admin
            .from("fulfillment_attempts")
            .select("*")
            .eq("order_id", id)
            .order("created_at", { ascending: false }),
          admin
            .from("profiles")
            .select("id,display_name,email,phone,account_status")
            .eq("id", order.user_id)
            .maybeSingle(),
        ]);
      return jsonResponse(
        {
          order,
          items: items ?? [],
          timeline: events ?? [],
          fulfillmentAttempts: attempts ?? [],
          customer: profile,
        },
        200,
        req,
      );
    }
    case "setFulfillmentStatus": {
      if (!write()) return deny(req, "orders.write");
      const id = String(payload.id ?? "");
      const status = String(payload.status ?? "");
      // Explicitly forbid payment confirmation from admin
      if (payload.paymentStatus || payload.markPaid) {
        return jsonResponse(
          { error: "FORBIDDEN_ACTION", message: "Manual payment confirmation is not allowed." },
          403,
          req,
        );
      }
      const allowed = [
        "not_started",
        "fulfillment_pending",
        "processing",
        "manual_review",
        "failed",
      ];
      if (!allowed.includes(status)) {
        return jsonResponse({ error: "INVALID_STATUS" }, 400, req);
      }
      await admin
        .from("orders")
        .update({ fulfillment_status: status, updated_at: new Date().toISOString() })
        .eq("id", id);
      await admin.from("order_status_events").insert({
        order_id: id,
        fulfillment_status: status,
        note: String(payload.note ?? "admin update"),
        actor: `admin:${ctx.userId}`,
      });
      await writeAudit(admin, ctx.userId, "admin_set_fulfillment_status", "order", id, { status });
      return jsonResponse({ ok: true }, 200, req);
    }
    case "cancel": {
      if (!write()) return deny(req, "orders.write");
      const id = String(payload.id ?? "");
      await admin
        .from("orders")
        .update({ payment_status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id)
        .in("payment_status", ["pending_payment", "payment_processing"]);
      await writeAudit(admin, ctx.userId, "admin_cancel_order", "order", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}

async function handleUsers(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  const read = () => requirePermission(ctx, "users.read");
  const write = () => requirePermission(ctx, "users.write");

  switch (action) {
    case "list": {
      if (!read()) return deny(req, "users.read");
      let q = admin
        .from("profiles")
        .select("id,display_name,email,phone,country_code,account_status,is_admin,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (payload.q) {
        const term = String(payload.q);
        q = q.or(`email.ilike.%${term}%,display_name.ilike.%${term}%,phone.ilike.%${term}%`);
      }
      if (payload.status) q = q.eq("account_status", String(payload.status));
      const { data } = await q;
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "get": {
      if (!read()) return deny(req, "users.read");
      const id = String(payload.id ?? "");
      const [{ data: profile }, { data: sessions }, { data: roles }, { data: orders }] =
        await Promise.all([
          admin.from("profiles").select("*").eq("id", id).maybeSingle(),
          admin
            .from("device_sessions")
            .select("id,device,last_active,created_at,revoked_at")
            .eq("user_id", id)
            .order("last_active", { ascending: false }),
          admin.from("admin_user_roles").select("role_id").eq("user_id", id),
          admin
            .from("orders")
            .select("id,payment_status,fulfillment_status,total,created_at")
            .eq("user_id", id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
      if (!profile) return jsonResponse({ error: "NOT_FOUND" }, 404, req);
      return jsonResponse(
        {
          profile,
          sessions: sessions ?? [],
          roles: (roles ?? []).map((r) => r.role_id),
          orders: orders ?? [],
        },
        200,
        req,
      );
    }
    case "setStatus": {
      if (!write()) return deny(req, "users.write");
      const id = String(payload.id ?? "");
      const status = String(payload.status ?? "");
      if (!["active", "suspended", "banned"].includes(status)) {
        return jsonResponse({ error: "INVALID_STATUS" }, 400, req);
      }
      await admin.from("profiles").update({ account_status: status }).eq("id", id);
      await writeAudit(admin, ctx.userId, `admin_user_${status}`, "user", id);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "setRoles": {
      if (!requirePermission(ctx, "roles.write") && !ctx.isSuperAdmin) {
        return deny(req, "roles.write");
      }
      const id = String(payload.id ?? "");
      const roles = Array.isArray(payload.roles) ? payload.roles.map(String) : [];
      await admin.from("admin_user_roles").delete().eq("user_id", id);
      if (roles.length) {
        await admin.from("admin_user_roles").insert(roles.map((role_id) => ({ user_id: id, role_id })));
      }
      await writeAudit(admin, ctx.userId, "admin_set_user_roles", "user", id, { roles });
      return jsonResponse({ ok: true }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}

async function handleSupport(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  const read = () => requirePermission(ctx, "support.read");
  const write = () => requirePermission(ctx, "support.write");

  switch (action) {
    case "list": {
      if (!read()) return deny(req, "support.read");
      let q = admin
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (payload.status) q = q.eq("status", String(payload.status));
      const { data } = await q;
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "get": {
      if (!read()) return deny(req, "support.read");
      const id = String(payload.id ?? "");
      const [{ data: ticket }, { data: messages }] = await Promise.all([
        admin.from("support_tickets").select("*").eq("id", id).maybeSingle(),
        admin
          .from("support_ticket_messages")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at"),
      ]);
      if (!ticket) return jsonResponse({ error: "NOT_FOUND" }, 404, req);
      return jsonResponse({ ticket, messages: messages ?? [] }, 200, req);
    }
    case "reply": {
      if (!write()) return deny(req, "support.write");
      const ticketId = String(payload.ticketId ?? "");
      const body = String(payload.body ?? "").trim();
      if (!body) return jsonResponse({ error: "VALIDATION" }, 400, req);
      await admin.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        author_id: ctx.userId,
        author_role: "admin",
        body,
        attachment_path: payload.attachmentPath ? String(payload.attachmentPath) : null,
      });
      await admin
        .from("support_tickets")
        .update({
          status: String(payload.status ?? "waiting_for_customer"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);
      await writeAudit(admin, ctx.userId, "admin_support_reply", "support_ticket", ticketId);
      return jsonResponse({ ok: true }, 200, req);
    }
    case "assign": {
      if (!write()) return deny(req, "support.write");
      const id = String(payload.id ?? "");
      const assignedTo = payload.assignedTo ? String(payload.assignedTo) : null;
      await admin
        .from("support_tickets")
        .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
        .eq("id", id);
      await writeAudit(admin, ctx.userId, "admin_support_assign", "support_ticket", id, {
        assignedTo,
      });
      return jsonResponse({ ok: true }, 200, req);
    }
    case "setStatus": {
      if (!write()) return deny(req, "support.write");
      const id = String(payload.id ?? "");
      const status = String(payload.status ?? "");
      await admin
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      await writeAudit(admin, ctx.userId, "admin_support_status", "support_ticket", id, { status });
      return jsonResponse({ ok: true }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}

async function handleNotifications(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  if (!requirePermission(ctx, "notifications.write")) return deny(req, "notifications.write");
  if (action !== "send") return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);

  const titleEn = String(payload.titleEn ?? "");
  const titleAr = String(payload.titleAr ?? titleEn);
  const bodyEn = String(payload.bodyEn ?? "");
  const bodyAr = String(payload.bodyAr ?? bodyEn);
  const type = String(payload.type ?? "promo");
  const userId = payload.userId ? String(payload.userId) : null;

  if (!titleEn || !bodyEn) return jsonResponse({ error: "VALIDATION" }, 400, req);

  if (userId) {
    await admin.from("notifications").insert({
      user_id: userId,
      title_en: titleEn,
      title_ar: titleAr,
      body_en: bodyEn,
      body_ar: bodyAr,
      type,
    });
  } else {
    // Global: fan-out to recent active users (bounded)
    const { data: users } = await admin
      .from("profiles")
      .select("id")
      .eq("account_status", "active")
      .limit(500);
    const rows = (users ?? []).map((u) => ({
      user_id: u.id,
      title_en: titleEn,
      title_ar: titleAr,
      body_en: bodyEn,
      body_ar: bodyAr,
      type,
    }));
    if (rows.length) await admin.from("notifications").insert(rows);
  }

  await writeAudit(admin, ctx.userId, "admin_send_notification", "notification", userId ?? "global", {
    type,
  });
  return jsonResponse({ ok: true }, 200, req);
}

async function handleSettings(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  switch (action) {
    case "list": {
      if (!requirePermission(ctx, "settings.read")) return deny(req, "settings.read");
      const { data } = await admin.from("app_settings").select("*").order("key");
      return jsonResponse({ items: data ?? [] }, 200, req);
    }
    case "upsert": {
      if (!requirePermission(ctx, "settings.write")) return deny(req, "settings.write");
      const key = String(payload.key ?? "");
      const value = payload.value;
      if (!key) return jsonResponse({ error: "VALIDATION" }, 400, req);
      await admin.from("app_settings").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      });
      await writeAudit(admin, ctx.userId, "admin_upsert_setting", "app_setting", key);
      return jsonResponse({ ok: true }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}

async function handleAudit(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  if (action !== "list") return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  if (!requirePermission(ctx, "audit.read")) return deny(req, "audit.read");

  let q = admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (payload.action) q = q.eq("action", String(payload.action));
  if (payload.entityType) q = q.eq("entity_type", String(payload.entityType));
  if (payload.userId) q = q.eq("user_id", String(payload.userId));
  const { data } = await q;
  return jsonResponse({ items: data ?? [] }, 200, req);
}

async function handleRoles(
  admin: ServiceClient,
  ctx: AdminContext,
  action: string,
  payload: Record<string, unknown>,
  req: Request,
) {
  switch (action) {
    case "list": {
      if (!requirePermission(ctx, "roles.read")) return deny(req, "roles.read");
      const [{ data: roles }, { data: perms }] = await Promise.all([
        admin.from("admin_roles").select("*").order("id"),
        admin.from("admin_role_permissions").select("*"),
      ]);
      return jsonResponse({ roles: roles ?? [], permissions: perms ?? [] }, 200, req);
    }
    case "setRolePermissions": {
      if (!requirePermission(ctx, "roles.write")) return deny(req, "roles.write");
      const roleId = String(payload.roleId ?? "");
      const permissions = Array.isArray(payload.permissions)
        ? payload.permissions.map(String)
        : [];
      if (roleId === "super_admin") {
        return jsonResponse({ error: "Cannot edit super_admin permissions" }, 400, req);
      }
      await admin.from("admin_role_permissions").delete().eq("role_id", roleId);
      if (permissions.length) {
        await admin
          .from("admin_role_permissions")
          .insert(permissions.map((permission) => ({ role_id: roleId, permission })));
      }
      await writeAudit(admin, ctx.userId, "admin_set_role_permissions", "admin_role", roleId, {
        permissions,
      });
      return jsonResponse({ ok: true }, 200, req);
    }
    default:
      return jsonResponse({ error: "UNKNOWN_ACTION" }, 400, req);
  }
}
