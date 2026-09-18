import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from './simulation.store';
import { handleSimulationRequest, rememberShopData } from './local-api';

const requests = new Set<AbortController>();
let generation = 0;

export function cancelSimulationRequests(): void {
  generation++;
  requests.forEach((controller) => controller.abort());
  requests.clear();
}

export function trackSimulationRequest(signal?: AbortSignal | null) {
  const controller = new AbortController();
  const version = generation;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  requests.add(controller);
  return {
    signal: controller.signal,
    assertCurrent() {
      if (version !== generation || controller.signal.aborted) {
        throw new DOMException('Changement de contexte de simulation', 'AbortError');
      }
    },
    release() {
      requests.delete(controller);
      signal?.removeEventListener('abort', abort);
    },
  };
}

/** The only network business reads allowed in simulation are explicit shop routes. */
export function simulationTransport(url: string, options: RequestInit) {
  const parsed = new URL(
    url,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  );
  const path = parsed.pathname;
  const method = (options.method ?? 'GET').toUpperCase();
  const sameOrigin = typeof window === 'undefined' || parsed.origin === window.location.origin;
  const control = sameOrigin && path === '/api/v1/role-simulation';
  const role = useAuthStore.getState().simulatedRole;
  const phase = useSimulationStore.getState().phase;
  if (control && (method === 'GET' || method === 'DELETE' || (method === 'POST' && !role))) {
    return { url, local: null, shop: false };
  }
  if (phase === 'checking' || phase === 'transition' || phase === 'error') {
    throw new DOMException('Simulation en cours de synchronisation', 'AbortError');
  }
  if (!role) {
    // A stale form/cleanup callback must never send a demo entity after exit.
    const body = typeof options.body === 'string' ? options.body : '';
    if (/d3e00000-0000-4000-8000-[0-9a-f]{12}/i.test(`${url} ${body}`)) {
      throw new DOMException('Donnée de simulation hors de son contexte', 'AbortError');
    }
    return { url, local: null, shop: false };
  }
  // Infrastructure reads use the real identity and cannot replace it with a demo profile.
  if (sameOrigin && method === 'GET' && /^\/api\/v1\/(?:platform\/)?auth\/me$/.test(path)) {
    return { url, local: null, shop: false };
  }
  const shop =
    /^\/api\/v1\/(?:platform\/|role-simulation\/)?shop\/(learning-paths(?:\/[a-zA-Z0-9-]+)?|learning-path-categories)$/.exec(
      path,
    );
  if (sameOrigin && method === 'GET' && shop) {
    return {
      url: `/api/v1/role-simulation/shop/${shop[1]}${parsed.search}`,
      local: null,
      shop: true,
    };
  }
  return { url, local: handleSimulationRequest(url, options), shop: false };
}

export { rememberShopData };
