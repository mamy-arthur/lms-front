'use client';

import { useSessionRevalidation } from '@/shared/hooks/useSessionRevalidation';
import { useSessionRevocation } from '@/shared/hooks/useSessionRevocation';

/**
 * Thin client wrapper that runs useSessionRevocation inside a server layout.
 *
 * Legacy sessions (logged in before sessionId was introduced) are handled by
 * useSessionRevalidation: only a /auth/me answering with session_id = null
 * proves the session predates the tracking and forces a re-auth.
 */
export function SessionRevocationListener() {
  useSessionRevocation();
  useSessionRevalidation();

  return null;
}
