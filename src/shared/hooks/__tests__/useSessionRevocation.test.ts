/**
 * Tests unitaires — useSessionRevocation
 *
 * On vérifie le comportement du hook en mockant Echo, le store et le queryClient.
 */

jest.mock('@/shared/providers/EchoProvider', () => ({ useEcho: jest.fn() }));
jest.mock('@/shared/lib/query-client', () => ({ queryClient: { clear: jest.fn() } }));
jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => '/dashboard',
}));
jest.mock('@/shared/lib/apiClient', () => ({
  resolveLoginPath: jest.fn((p: string) => (p.startsWith('/admin') ? '/admin/login' : '/login')),
}));
jest.mock('@/shared/lib/echo', () => ({ resetEcho: jest.fn() }));

const mockRouterReplace = jest.fn();

import { renderHook } from '@testing-library/react';
import { useSessionRevocation } from '../useSessionRevocation';
import { useEcho } from '@/shared/providers/EchoProvider';
import { queryClient } from '@/shared/lib/query-client';
import { resetEcho } from '@/shared/lib/echo';
import { useAuthStore } from '@/shared/stores/auth.store';

const mockUseEcho = jest.mocked(useEcho);
const mockClear = jest.mocked(queryClient.clear);
const mockResetEcho = jest.mocked(resetEcho);

function makeEchoMock() {
  const stopListening = jest.fn();
  const leave = jest.fn();
  const listenCallbacks: Record<string, (e: unknown) => void> = {};

  const channelMock: { listen: jest.Mock; stopListening: jest.Mock } = {
    listen: jest.fn((event: string, cb: (e: unknown) => void) => {
      listenCallbacks[event] = cb;
      return channelMock;
    }),
    stopListening,
  };

  const echoMock = {
    private: jest.fn(() => channelMock),
    disconnect: jest.fn(),
    leave,
  };

  return { echoMock, channelMock, listenCallbacks, stopListening, leave };
}

const SESSION_ID = 'session-uuid-abc';
const mockClearAuth = jest.fn();

describe('useSessionRevocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterReplace.mockReset();
    sessionStorage.clear();

    (useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { sessionId: string | null }) => unknown) =>
        selector({ sessionId: SESSION_ID }),
    );
    (useAuthStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => ({
      clearAuth: mockClearAuth,
    }));
  });

  it("s'abonne au canal privé de la session", () => {
    const { echoMock } = makeEchoMock();
    mockUseEcho.mockReturnValue(echoMock as never);

    renderHook(() => useSessionRevocation());

    expect(echoMock.private).toHaveBeenCalledWith(`session.${SESSION_ID}`);
  });

  it('ne fait rien si sessionId est null', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation(() => null);
    const { echoMock } = makeEchoMock();
    mockUseEcho.mockReturnValue(echoMock as never);

    renderHook(() => useSessionRevocation());

    expect(echoMock.private).not.toHaveBeenCalled();
  });

  it('ne fait rien si echo est null', () => {
    mockUseEcho.mockReturnValue(null);
    renderHook(() => useSessionRevocation());
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it('vide le store et redirige sur SessionRevoked NEW_LOGIN', () => {
    const { echoMock, listenCallbacks } = makeEchoMock();
    mockUseEcho.mockReturnValue(echoMock as never);

    renderHook(() => useSessionRevocation());

    listenCallbacks['.SessionRevoked']?.({ reason: 'NEW_LOGIN' });

    expect(mockResetEcho).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
    expect(sessionStorage.getItem('revocation_reason')).toBe('NEW_LOGIN');
    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
  });

  it('ignore un événement SessionRevoked avec une raison inconnue', () => {
    const { echoMock, listenCallbacks } = makeEchoMock();
    mockUseEcho.mockReturnValue(echoMock as never);

    renderHook(() => useSessionRevocation());

    listenCallbacks['.SessionRevoked']?.({ reason: 'OTHER' });

    expect(mockClear).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('se désabonne proprement au démontage', () => {
    const { echoMock, stopListening, leave } = makeEchoMock();
    mockUseEcho.mockReturnValue(echoMock as never);

    const { unmount } = renderHook(() => useSessionRevocation());
    unmount();

    expect(stopListening).toHaveBeenCalledWith('.SessionRevoked');
    expect(leave).toHaveBeenCalledWith(`session.${SESSION_ID}`);
  });
});
