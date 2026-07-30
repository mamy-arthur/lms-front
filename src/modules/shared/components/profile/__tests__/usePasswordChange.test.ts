/**
 * Tests unitaires — usePasswordChange
 *
 * Couvre :
 *  - état initial
 *  - validation : mot de passe trop court (< 8 chars)
 *  - validation : mots de passe non identiques
 *  - retour anticipé si user absent
 *  - happy path : appel API + reset des champs
 *  - gestion d'erreur : json.errors.current_password
 *  - gestion d'erreur : json.message
 *  - gestion d'erreur : message générique
 *  - isSaving pendant la requête
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiPatch: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { act, renderHook } from '@testing-library/react';
import { apiPatch } from '@/shared/lib/apiClient';
import { toast } from 'sonner';
import { useAuthStore } from '@/shared/stores/auth.store';
import { usePasswordChange } from '../usePasswordChange';
import { Role } from '@/shared/constants/roles';

const mockApiPatch = jest.mocked(apiPatch);
const mockToastSuccess = jest.mocked(toast.success);
const mockToastError = jest.mocked(toast.error);

const MOCK_USER = {
  id: 'u-001',
  name: 'Alice Dupont',
  email: 'alice@example.com',
  role: Role.TRAINEE,
};

function setupWithUser() {
  useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });
}

function setupFields(
  result: ReturnType<typeof renderHook<ReturnType<typeof usePasswordChange>, unknown>>['result'],
) {
  act(() => {
    result.current.setCurrentPassword('OldPass1');
    result.current.setNewPassword('NewPass12');
    result.current.setConfirmPassword('NewPass12');
  });
}

describe('usePasswordChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, role: null });
  });

  // ── État initial ──────────────────────────────────────────────────────────

  it('currentPassword vaut chaîne vide initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.currentPassword).toBe('');
  });

  it('newPassword vaut chaîne vide initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.newPassword).toBe('');
  });

  it('error vaut null initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.error).toBeNull();
  });

  it('isSaving vaut false initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.isSaving).toBe(false);
  });

  // ── Retour anticipé si pas d'utilisateur ─────────────────────────────────

  it("ne fait pas d'appel API si user absent", async () => {
    const { result } = renderHook(() => usePasswordChange());
    act(() => {
      result.current.setNewPassword('NewPass12');
      result.current.setConfirmPassword('NewPass12');
    });
    await act(async () => {
      await result.current.handleChangePassword();
    });
    expect(mockApiPatch).not.toHaveBeenCalled();
  });

  // ── Validations ───────────────────────────────────────────────────────────

  it('définit une erreur si newPassword < 8 caractères', async () => {
    setupWithUser();
    const { result } = renderHook(() => usePasswordChange());
    act(() => {
      result.current.setNewPassword('short');
      result.current.setConfirmPassword('short');
    });
    await act(async () => {
      await result.current.handleChangePassword();
    });
    expect(result.current.error).toBe('Le mot de passe doit contenir au moins 8 caractères.');
    expect(mockApiPatch).not.toHaveBeenCalled();
  });

  it('définit une erreur si les mots de passe ne correspondent pas', async () => {
    setupWithUser();
    const { result } = renderHook(() => usePasswordChange());
    act(() => {
      result.current.setNewPassword('NewPass12');
      result.current.setConfirmPassword('Different1');
    });
    await act(async () => {
      await result.current.handleChangePassword();
    });
    expect(result.current.error).toBe('Les mots de passe ne correspondent pas.');
    expect(mockApiPatch).not.toHaveBeenCalled();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('appelle PATCH :path/:id/password avec le bon payload', async () => {
    setupWithUser();
    mockApiPatch.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordChange({ patchPath: 'platform/users' }));
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(mockApiPatch).toHaveBeenCalledWith('platform/users/u-001/password', {
      current_password: 'OldPass1',
      password: 'NewPass12',
      password_confirmation: 'NewPass12',
    });
  });

  it('remet les champs à vide après succès', async () => {
    setupWithUser();
    mockApiPatch.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.currentPassword).toBe('');
    expect(result.current.newPassword).toBe('');
    expect(result.current.confirmPassword).toBe('');
  });

  it('appelle toast.success après succès', async () => {
    setupWithUser();
    mockApiPatch.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Mot de passe modifié');
  });

  it('isSaving repasse à false après succès', async () => {
    setupWithUser();
    mockApiPatch.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.isSaving).toBe(false);
  });

  // ── Gestion d'erreur ──────────────────────────────────────────────────────

  it("utilise json.errors.current_password comme message d'erreur", async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue({
      json: { errors: { current_password: ['Mot de passe actuel incorrect.'] } },
    });
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.error).toBe('Mot de passe actuel incorrect.');
    expect(mockToastError).toHaveBeenCalledWith('Mot de passe actuel incorrect.');
  });

  it("utilise json.message comme message d'erreur si errors absent", async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue({ json: { message: 'Erreur serveur.' } });
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.error).toBe('Erreur serveur.');
  });

  it('utilise le message générique si json absent', async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue(new Error('Network'));
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.error).toBe('Échec du changement de mot de passe.');
  });

  it('isSaving repasse à false après une erreur', async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.isSaving).toBe(false);
  });
});
