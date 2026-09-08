import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher?: typeof Pusher;
  }
}

let echoInstance: Echo<'reverb'> | null = null;

/**
 * Instance Echo unique (singleton), connectée au serveur Reverb du backend.
 *
 * Authentification des channels privés via `/broadcasting/auth` (même origine,
 * cookie httpOnly `auth_token` envoyé automatiquement — pas de token en JS).
 */
export function getEcho(): Echo<'reverb'> {
  if (typeof window === 'undefined') {
    throw new Error('getEcho() ne peut être appelé que côté client.');
  }

  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? window.location.protocol.replace(':', '');
  // Reverb has no port of its own exposed to the browser: Caddy reverse-proxies
  // it on the same host/port as the page, under the /app/* path (see
  // .docker/caddy/Caddyfile) — only override wsPort/wssPort if explicitly configured.
  const port = process.env.NEXT_PUBLIC_REVERB_PORT
    ? Number(process.env.NEXT_PUBLIC_REVERB_PORT)
    : undefined;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? '',
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? window.location.hostname,
    ...(port !== undefined ? { wsPort: port, wssPort: port } : {}),
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
  });

  return echoInstance;
}
