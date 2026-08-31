'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type Echo from 'laravel-echo';
import type { ChannelAuthorizationCallback } from 'pusher-js';

const EchoContext = createContext<Echo<'reverb'> | null>(null);

export function useEcho(): Echo<'reverb'> | null {
  return useContext(EchoContext);
}

async function createEchoInstance(): Promise<Echo<'reverb'>> {
  const [{ default: EchoClass }, { default: Pusher }] = await Promise.all([
    import('laravel-echo'),
    import('pusher-js'),
  ]);

  // Make Pusher available globally as required by laravel-echo
  (window as typeof window & { Pusher: typeof Pusher }).Pusher = Pusher;

  const wsHost = window.location.hostname;
  const wsPort = Number(window.location.port || (window.location.protocol === 'https:' ? 443 : 80));

  return new EchoClass({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost,
    wsPort,
    wssPort: wsPort,
    forceTLS: window.location.protocol === 'https:',
    enabledTransports: ['ws', 'wss'],
    // Private channel auth uses credentials: 'include' so the Sanctum cookie is sent
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
        fetch('/broadcasting/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((res) => res.json())
          .then((data) => callback(null, data))
          .catch((err: Error) => callback(err, null));
      },
    }),
  });
}

interface Props {
  children: React.ReactNode;
}

export function EchoProvider({ children }: Props) {
  const [echo, setEcho] = useState<Echo<'reverb'> | null>(null);

  useEffect(() => {
    let instance: Echo<'reverb'> | null = null;

    createEchoInstance()
      .then((e) => {
        instance = e;
        setEcho(e);
      })
      .catch((err: unknown) => console.error('[EchoProvider] Failed to initialize Echo:', err));

    return () => {
      instance?.disconnect();
      setEcho(null);
    };
  }, []);

  return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>;
}
