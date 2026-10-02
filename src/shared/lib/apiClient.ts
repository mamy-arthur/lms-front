import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import {
  simulationTransport,
  trackSimulationRequest,
  rememberShopData,
} from '@/shared/simulation/transport';

/**
 * Retourne le chemin de login adapté au contexte courant.
 * Exporté pour être testé indépendamment.
 */
export function resolveLoginPath(pathname: string): string {
  return pathname.startsWith('/admin') ? '/admin/login' : '/login';
}

export interface HttpOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Client HTTP centralisé.
 *
 * - credentials: "include" → envoie automatiquement le cookie HttpOnly
 *   posé par le backend lors du login (aucun token en mémoire JS).
 * - Sur 401 : vide le store utilisateur et redirige vers la page de login
 *   correspondant au contexte (/admin/login ou /login).
 */
export const httpClient = async (
  url: string,
  options: HttpOptions = {},
): Promise<{
  status: number;
  headers: Headers;
  body: string;
  json: unknown;
}> => {
  let finalUrl = url;
  if (!url.startsWith('/api') && !url.startsWith('http')) {
    finalUrl = `/api/v1/${url.replace(/^\/+/, '')}`;
  }

  const transport = simulationTransport(finalUrl, options);
  if (transport.local) return transport.local;
  finalUrl = transport.url;

  const headers = new Headers(options.headers as HeadersInit | undefined);
  const tenant = useTenantStore.getState().tenant;

  headers.set('Accept', 'application/json');
  if (tenant) headers.set('X-Tenant-ID', tenant.id);
  if (options.body) headers.set('Content-Type', 'application/json');

  const pending = trackSimulationRequest(options.signal);
  let res: Response;
  let body: string;
  try {
    res = await fetch(finalUrl, {
      ...options,
      headers,
      credentials: 'include',
      signal: pending.signal,
    });
    body = await res.text();
    pending.assertCurrent();
  } finally {
    pending.release();
  }
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    json = body;
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.replace(resolveLoginPath(window.location.pathname));
      }
    }
    const err = Object.assign(new Error(res.statusText), {
      status: res.status,
      headers: res.headers,
      body,
      json,
    });
    throw err;
  }

  if (transport.shop) rememberShopData(json, transport.url);
  return { status: res.status, headers: res.headers, body, json };
};

export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>,
  options: Pick<HttpOptions, 'signal'> = {},
): Promise<T> {
  let url = `/api/v1/${path.replace(/^\/+/, '')}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  const { json } = await httpClient(url, options);
  return json as T;
}

export async function apiPost<T, B = unknown>(path: string, body?: B): Promise<T> {
  const { json } = await httpClient(`/api/v1/${path.replace(/^\/+/, '')}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiPut<T, B = unknown>(path: string, body?: B): Promise<T> {
  const { json } = await httpClient(`/api/v1/${path.replace(/^\/+/, '')}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiPatch<T, B = unknown>(path: string, body?: B): Promise<T> {
  const { json } = await httpClient(`/api/v1/${path.replace(/^\/+/, '')}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return json as T;
}

export async function apiDelete(path: string): Promise<void> {
  await httpClient(`/api/v1/${path.replace(/^\/+/, '')}`, { method: 'DELETE' });
}

/** Upload multipart/form-data (ne pose pas Content-Type: application/json). */
export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const url = `/api/v1/${path.replace(/^\/+/, '')}`;
  const transport = simulationTransport(url, { method: 'POST', body });
  if (transport.local) return (await transport.local).json as T;
  const tenant = useTenantStore.getState().tenant;
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (tenant) headers.set('X-Tenant-ID', tenant.id);
  // Pas de Content-Type : le navigateur le génère automatiquement avec le boundary

  const pending = trackSimulationRequest();
  let res: Response;
  let text: string;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
      signal: pending.signal,
    });
    text = await res.text();
    pending.assertCurrent();
  } finally {
    pending.release();
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.replace(resolveLoginPath(window.location.pathname));
      }
    }
    throw Object.assign(new Error(res.statusText), { status: res.status, json });
  }
  return json as T;
}

/** Upload multipart/form-data avec suivi de progression via XHR. */
export function apiUploadWithProgress<T>(
  path: string,
  body: FormData,
  onProgress: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = `/api/v1/${path.replace(/^\/+/, '')}`;
    const transport = simulationTransport(url, { method: 'POST', body });
    if (transport.local) {
      transport.local.then((result) => {
        onProgress(100);
        resolve(result.json as T);
      }, reject);
      return;
    }
    const tenant = useTenantStore.getState().tenant;
    const xhr = new XMLHttpRequest();
    const pending = trackSimulationRequest();
    pending.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.onloadend = () => pending.release();
    xhr.onabort = () => reject(new DOMException('Simulation context changed', 'AbortError'));

    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    if (tenant) xhr.setRequestHeader('X-Tenant-ID', tenant.id);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        pending.assertCurrent();
      } catch (error) {
        reject(error);
        return;
      }
      let json: unknown;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(json as T);
      } else {
        if (xhr.status === 401) {
          useAuthStore.getState().clearAuth();
          if (typeof window !== 'undefined') {
            window.location.replace(resolveLoginPath(window.location.pathname));
          }
        }
        reject(Object.assign(new Error(xhr.statusText), { status: xhr.status, json }));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(body);
  });
}
