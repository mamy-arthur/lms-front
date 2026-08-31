'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type Echo from 'laravel-echo';

const EchoContext = createContext<Echo | null>(null);

export function useEcho(): Echo | null {
  return useContext(EchoContext);
}

async function createEchoInstance(): Promise<Echo> {
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
      authorize: (socketId: string, callback: (error: Error | null, data: unknown) => void) => {
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
  const [echo, setEcho] = useState<Echo | null>(null);

  useEffect(() => {
    let instance: Echo | null = null;

    createEchoInstance().then((e) => {
      instance = e;
      setEcho(e);
    });

    return () => {
      instance?.disconnect();
      setEcho(null);
    };
  }, []);

  return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>;
}
