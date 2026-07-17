import { supabase } from "./supabase";

export type AdminMe = {
  userId: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
};

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function adminApi<T = unknown>(
  resource: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-api", {
    body: { resource, action, payload },
  });

  if (error) {
    throw new AdminApiError(error.message || "Admin API failed", 500);
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    const message =
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message
        : String((data as { error: string }).error);
    throw new AdminApiError(message, 400);
  }

  return data as T;
}
