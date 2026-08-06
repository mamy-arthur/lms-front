/**
 * Tests unitaires — usePasswordChange
 *
 * Couvre :
 *  - état initial du form (valeurs par défaut)
 *  - retour anticipé si user absent
 *  - validation Zod : mot de passe trop court
 *  - validation Zod : mots de passe non identiques
 *  - happy path : appel API + reset du form
 *  - gestion erreur serveur : json.errors.current_password → setError champ
 *  - gestion erreur serveur : json.message → setError root + toast
 *  - gestion erreur : message générique
 *  - isSubmitting repasse à false après succès/erreur
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
    result.current.form.setValue('current_password', 'OldPass1');
    result.current.form.setValue('password', 'NewPass12');
    result.current.form.setValue('password_confirmation', 'NewPass12');
  });
}

describe('usePasswordChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, role: null });
  });

  // ── État initial ──────────────────────────────────────────────────────────

  it('current_password vaut chaîne vide initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.form.getValues('current_password')).toBe('');
  });

  it('password vaut chaîne vide initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.form.getValues('password')).toBe('');
  });

  it("pas d'erreur root initialement", () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.form.formState.errors.root).toBeUndefined();
  });

  it('isSubmitting vaut false initialement', () => {
    const { result } = renderHook(() => usePasswordChange());
    expect(result.current.form.formState.isSubmitting).toBe(false);
  });

  // ── Retour anticipé si pas d'utilisateur ─────────────────────────────────

  it("ne fait pas d'appel API si user absent", async () => {
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);
    await act(async () => {
      await result.current.handleChangePassword();
    });
    expect(mockApiPatch).not.toHaveBeenCalled();
  });

  // ── Validations Zod ───────────────────────────────────────────────────────

  it('erreur Zod si password < 8 caractères', async () => {
    setupWithUser();
    const { result } = renderHook(() => usePasswordChange());
    act(() => {
      result.current.form.setValue('current_password', 'OldPass1');
      result.current.form.setValue('password', 'short');
      result.current.form.setValue('password_confirmation', 'short');
    });
    await act(async () => {
      await result.current.handleChangePassword();
    });
    expect(result.current.form.getFieldState('password').error?.message).toBe(
      'Minimum 8 caractères',
    );
    expect(mockApiPatch).not.toHaveBeenCalled();
  });

  it('erreur Zod si les mots de passe ne correspondent pas', async () => {
    setupWithUser();
    const { result } = renderHook(() => usePasswordChange());
    act(() => {
      result.current.form.setValue('current_password', 'OldPass1');
      result.current.form.setValue('password', 'NewPass12');
      result.current.form.setValue('password_confirmation', 'Different1');
    });
    await act(async () => {
      await result.current.handleChangePassword();
    });
    expect(result.current.form.getFieldState('password_confirmation').error?.message).toBe(
      'Les mots de passe ne correspondent pas.',
    );
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

  it('remet le form à vide après succès', async () => {
    setupWithUser();
    mockApiPatch.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.form.getValues('current_password')).toBe('');
    expect(result.current.form.getValues('password')).toBe('');
    expect(result.current.form.getValues('password_confirmation')).toBe('');
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

  it('isSubmitting repasse à false après succès', async () => {
    setupWithUser();
    mockApiPatch.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.form.formState.isSubmitting).toBe(false);
  });

  // ── Gestion d'erreur ──────────────────────────────────────────────────────

  it('json.errors.current_password → setError sur le champ current_password', async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue({
      json: { errors: { current_password: ['Mot de passe actuel incorrect.'] } },
    });
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.form.getFieldState('current_password').error?.message).toBe(
      'Mot de passe actuel incorrect.',
    );
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('json.message → setError root + toast.error si errors absent', async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue({ json: { message: 'Erreur serveur.' } });
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(mockToastError).toHaveBeenCalledWith('Erreur serveur.');
  });

  it('message générique si json absent', async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue(new Error('Network'));
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(mockToastError).toHaveBeenCalledWith('Échec du changement de mot de passe.');
  });

  it('isSubmitting repasse à false après une erreur', async () => {
    setupWithUser();
    mockApiPatch.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePasswordChange());
    setupFields(result);

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.form.formState.isSubmitting).toBe(false);
  });
});
