/**
 * Tests unitaires — useProfileForm
 *
 * Couvre :
 *  - état initial (photoPreview, uploadError, loadError)
 *  - useEffect : charge le profil quand user.id présent
 *  - useEffect : ignore si user absent
 *  - useEffect : définit loadError si le fetch échoue
 *  - handlePhotoSelect : ignore si pas de fichier
 *  - handlePhotoSelect : stocke le fichier et déclenche la prévisualisation
 *  - handleSave sans photo : appelle apiPatch + setAuth
 *  - handleSave avec photo en attente : upload puis patch
 *  - handleSave : erreur d'upload → définit uploadError, n'appelle pas apiPatch
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
}));

jest.mock('@/modules/shared/lib/uploadUserProfilePhoto', () => ({
  uploadUserProfilePhoto: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/shared/lib/apiClient';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { toast } from 'sonner';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useProfileForm } from '../useProfileForm';
import { Role } from '@/shared/constants/roles';

const mockApiGet = jest.mocked(apiGet);
const mockApiPatch = jest.mocked(apiPatch);
const mockUpload = jest.mocked(uploadUserProfilePhoto);
const mockToastSuccess = jest.mocked(toast.success);
const mockToastError = jest.mocked(toast.error);

const MOCK_USER = {
  id: 'u-001',
  name: 'Alice Dupont',
  email: 'alice@example.com',
  role: Role.TRAINEE,
  avatar: null as string | null | undefined,
};

const PROFILE_DATA = {
  first_name: 'Alice',
  last_name: 'Dupont',
  address: '12 rue de la Paix',
  zip_code: '75001',
  city: 'Paris',
  country: 'FR',
  timezone: 'Europe/Paris',
  preferred_language: 'fr',
};

let queryClient: QueryClient;

const getWrapper = () =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe('useProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, role: null });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  // ── État initial ──────────────────────────────────────────────────────────

  it('photoPreview vaut null initialement', () => {
    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });
    expect(result.current.photoPreview).toBeNull();
  });

  it('uploadError vaut null initialement', () => {
    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });
    expect(result.current.uploadError).toBeNull();
  });

  it('loadError vaut null initialement', () => {
    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });
    expect(result.current.loadError).toBeNull();
  });

  it('fileInputRef est présent', () => {
    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });
    expect(result.current.fileInputRef).toBeDefined();
  });

  // ── useEffect fetch ───────────────────────────────────────────────────────

  it("charge le profil depuis l'API si user.id présent", async () => {
    mockApiGet.mockResolvedValue({ data: PROFILE_DATA });
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });

    renderHook(() => useProfileForm({ patchPath: 'platform/users' }), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('platform/users/u-001');
    });
  });

  it("ne fait pas d'appel API si user absent", async () => {
    renderHook(() => useProfileForm(), { wrapper: getWrapper() });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('définit loadError si le fetch échoue', async () => {
    mockApiGet.mockRejectedValue(new Error('Network'));
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });

    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });

    await waitFor(() => {
      expect(result.current.loadError).toBe('Impossible de charger le profil. Veuillez réessayer.');
    });
    expect(mockToastError).toHaveBeenCalledWith('Impossible de charger le profil');
  });

  // ── handlePhotoSelect ─────────────────────────────────────────────────────

  it("ignore handlePhotoSelect si aucun fichier dans l'input", () => {
    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });
    const event = { target: { files: null } } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handlePhotoSelect(event));
    expect(result.current.photoPreview).toBeNull();
  });

  // ── handleSave sans photo ─────────────────────────────────────────────────

  it('handleSave appelle apiPatch avec les valeurs du formulaire', async () => {
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });
    mockApiPatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useProfileForm({ patchPath: 'platform/users' }), {
      wrapper: getWrapper(),
    });

    await act(async () => {
      await result.current.handleSave({
        first_name: 'Alice',
        last_name: 'Dupont',
        address: '12 rue de la Paix',
        zip_code: '75001',
        city: 'Paris',
        country: 'FR',
        timezone: 'Europe/Paris',
        preferred_language: 'fr',
      });
    });

    expect(mockApiPatch).toHaveBeenCalledWith(
      'platform/users/u-001',
      expect.objectContaining({ first_name: 'Alice', last_name: 'Dupont', country: 'FR' }),
    );
  });

  it('handleSave appelle toast.success après succès', async () => {
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });
    mockApiPatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });

    await act(async () => {
      await result.current.handleSave({ first_name: 'Alice', last_name: 'Dupont' });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Profil mis à jour');
  });

  it('handleSave ne fait rien si user absent', async () => {
    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });

    await act(async () => {
      await result.current.handleSave({ first_name: 'Alice', last_name: 'Dupont' });
    });

    expect(mockApiPatch).not.toHaveBeenCalled();
  });

  // ── handleSave avec upload photo ──────────────────────────────────────────

  it('upload la photo avant apiPatch si pendingPhoto présent', async () => {
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });
    mockUpload.mockResolvedValue({
      id: 'ph-1',
      url: 'https://cdn.example.com/photo.jpg',
      mime_type: 'image/jpeg',
    });
    mockApiPatch.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useProfileForm({ uploadPath: 'platform/users', patchPath: 'platform/users' }),
      { wrapper: getWrapper() },
    );

    // Simuler un fichier en attente via handlePhotoSelect
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handlePhotoSelect(event));

    await act(async () => {
      await result.current.handleSave({ first_name: 'Alice', last_name: 'Dupont' });
    });

    expect(mockUpload).toHaveBeenCalledWith('u-001', file, 'platform/users');
    expect(mockApiPatch).toHaveBeenCalled();
  });

  it("ne met pas à jour user.avatar avec l'URL de stockage après l'upload", async () => {
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });
    mockUpload.mockResolvedValue({
      id: 'ph-1',
      url: 'https://storage.example.com/photo.jpg',
      mime_type: 'image/jpeg',
    });
    mockApiPatch.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useProfileForm({ uploadPath: 'platform/users', patchPath: 'platform/users' }),
      { wrapper: getWrapper() },
    );

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    act(() =>
      result.current.handlePhotoSelect({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>),
    );

    await act(async () => {
      await result.current.handleSave({ first_name: 'Alice', last_name: 'Dupont' });
    });

    // avatar reste inchangé — sera mis à jour par le useEffect après refetch
    expect(useAuthStore.getState().user?.avatar).toBeNull();
  });

  it("définit uploadError et n'appelle pas apiPatch si l'upload échoue", async () => {
    useAuthStore.setState({ user: MOCK_USER, role: Role.TRAINEE });
    mockUpload.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useProfileForm(), { wrapper: getWrapper() });

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    act(() => result.current.handlePhotoSelect(event));

    await act(async () => {
      await result.current.handleSave({ first_name: 'Alice', last_name: 'Dupont' });
    });

    expect(result.current.uploadError).toBe("Échec de l'upload de la photo.");
    expect(mockApiPatch).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith("Échec de l'upload de la photo");
  });
});
