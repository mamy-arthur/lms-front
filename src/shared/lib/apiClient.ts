import { fetchUtils } from "react-admin";
import { getToken } from "@/shared/stores/auth.store";
import { useTenantStore } from "@/shared/stores/tenant.store";

export const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  let finalUrl = url;
  if (!url.startsWith("/api") && !url.startsWith("http")) {
    finalUrl = `/api/${url.replace(/^\/+/, "")}`;
  }

  const headers = new Headers(options.headers as HeadersInit | undefined);
  const token = getToken();
  const tenant = useTenantStore.getState().tenant;

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (tenant) headers.set("X-Tenant-ID", tenant.id);

  return fetchUtils.fetchJson(finalUrl, {
    ...options,
    headers,
    credentials: "same-origin",
  });
};

export async function apiGet<T>(path: string): Promise<T> {
  const { json } = await httpClient(`/api/${path.replace(/^\/+/, "")}`);
  return json as T;
}

export async function apiPost<T, B = unknown>(path: string, body?: B): Promise<T> {
  const { json } = await httpClient(`/api/${path.replace(/^\/+/, "")}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiPut<T, B = unknown>(path: string, body?: B): Promise<T> {
  const { json } = await httpClient(`/api/${path.replace(/^\/+/, "")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiDelete(path: string): Promise<void> {
  await httpClient(`/api/${path.replace(/^\/+/, "")}`, { method: "DELETE" });
}
