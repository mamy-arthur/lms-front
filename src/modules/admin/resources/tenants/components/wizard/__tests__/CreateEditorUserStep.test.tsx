/**
 * Tests fonctionnels — CreateEditorUserStep
 *
 * Couvre :
 *  - rendu des champs obligatoires
 *  - soumission valide : payload API, onLoadingChange, onSuccess, toast
 *  - échec API : toast.error + onLoadingChange(false)
 *  - upload photo en cascade (non-bloquant)
 */

// ─── Polyfills ───────────────────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/modules/admin/resources/users', () => ({
  adminUsersApi: { create: jest.fn() },
  ADMIN_USERS_QUERY_KEY: ['admin', 'users'] as const,
}));

jest.mock('@/modules/shared/lib/uploadUserProfilePhoto', () => ({
  uploadUserProfilePhoto: jest.fn(),
}));

// Composants enfants complexes — comportement testé dans leurs propres suites
jest.mock('@modules/shared/components/users/user-photo-field', () => ({
  UserPhotoField: jest.fn(() => null),
}));

jest.mock('@modules/shared/components/users/user-profile-fields', () => ({
  UserProfileFields: jest.fn(() => null),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import React, { createRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '@/modules/admin/resources/users';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { CreateEditorUserStep, type CreateEditorUserStepHandle } from '../CreateEditorUserStep';

const mockCreate = jest.mocked(adminUsersApi.create);
const mockUploadPhoto = jest.mocked(uploadUserProfilePhoto);
const mockToast = jest.mocked(toast);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const VALID_PAYLOAD = {
  last_name: 'Dupont',
  first_name: 'Jean',
  email: 'jean.dupont@acme.io',
  password: 'Secret1234',
};

function renderStep(overrides?: Partial<React.ComponentProps<typeof CreateEditorUserStep>>) {
  const ref = createRef<CreateEditorUserStepHandle>();
  const onSuccess = jest.fn();
  const onLoadingChange = jest.fn();

  render(
    <CreateEditorUserStep
      ref={ref}
      tenantId="tenant-001"
      tenantName="Acme Corp"
      editorId={null}
      onSuccess={onSuccess}
      onLoadingChange={onLoadingChange}
      {...overrides}
    />,
    { wrapper: makeWrapper() },
  );

  return { ref, onSuccess, onLoadingChange };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Nom' }), VALID_PAYLOAD.last_name);
  await user.type(screen.getByRole('textbox', { name: 'Prénom' }), VALID_PAYLOAD.first_name);
  await user.type(screen.getByRole('textbox', { name: 'Email' }), VALID_PAYLOAD.email);
  await user.type(screen.getByLabelText('Mot de passe'), VALID_PAYLOAD.password);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CreateEditorUserStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendu ────────────────────────────────────────────────────────────────

  it('affiche les champs obligatoires et les champs en lecture seule', () => {
    renderStep();

    expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Prénom' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByText('Éditeur')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  // ── Soumission valide ─────────────────────────────────────────────────────

  it('appelle adminUsersApi.create avec le bon payload sur soumission valide', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ data: { id: 'user-001' } } as never);

    const { ref } = renderStep();
    await fillForm(user);
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: VALID_PAYLOAD.first_name,
          last_name: VALID_PAYLOAD.last_name,
          email: VALID_PAYLOAD.email,
          password: VALID_PAYLOAD.password,
          tenant_id: 'tenant-001',
          editor_id: null,
          is_active: true,
        }),
        // TanStack Query v5 passe un contexte interne comme second argument
        expect.anything(),
      ),
    );
  });

  it('appelle onLoadingChange(true) avant la requête puis onSuccess après', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ data: { id: 'user-001' } } as never);

    const { ref, onSuccess, onLoadingChange } = renderStep();
    await fillForm(user);
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onLoadingChange).toHaveBeenNthCalledWith(1, true);
  });

  it('affiche un toast de succès après création', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ data: { id: 'user-001' } } as never);

    const { ref } = renderStep();
    await fillForm(user);
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() =>
      expect(mockToast.success).toHaveBeenCalledWith("L'éditeur a été créé avec succès."),
    );
  });

  // ── Échec API ─────────────────────────────────────────────────────────────

  it("affiche un toast d'erreur et reset le loading sur échec API", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValue(new Error('Network Error'));

    const { ref, onSuccess, onLoadingChange } = renderStep();
    await fillForm(user);
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith("Échec de la création de l'éditeur."),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onLoadingChange).toHaveBeenLastCalledWith(false);
  });

  // ── Upload photo ──────────────────────────────────────────────────────────

  it("n'appelle pas uploadUserProfilePhoto si aucune photo n'est sélectionnée", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ data: { id: 'user-001' } } as never);

    const { ref } = renderStep();
    await fillForm(user);
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockUploadPhoto).not.toHaveBeenCalled();
  });

  it("continue vers onSuccess si l'upload photo échoue (non-bloquant)", async () => {
    const user = userEvent.setup();
    const { UserPhotoField } = jest.requireMock(
      '@modules/shared/components/users/user-photo-field',
    );
    UserPhotoField.mockImplementation(
      ({ onFileSelected }: { onFileSelected: (f: File) => void }) => (
        <button type="button" onClick={() => onFileSelected(new File([''], 'photo.jpg'))}>
          Photo
        </button>
      ),
    );
    mockCreate.mockResolvedValue({ data: { id: 'user-001' } } as never);
    mockUploadPhoto.mockRejectedValue(new Error('Upload failed'));

    const { ref, onSuccess } = renderStep();
    await user.click(screen.getByRole('button', { name: 'Photo' }));
    await fillForm(user);
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith("Éditeur créé, mais l'upload photo a échoué.");
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it("n'appelle pas l'API si les champs obligatoires sont vides", async () => {
    const { ref } = renderStep();
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() => expect(mockCreate).not.toHaveBeenCalled());
  });

  it('affiche une erreur de validation si le mot de passe ne respecte pas les règles', async () => {
    const user = userEvent.setup();
    const { ref } = renderStep();

    await user.type(screen.getByRole('textbox', { name: 'Nom' }), 'Dupont');
    await user.type(screen.getByRole('textbox', { name: 'Prénom' }), 'Jean');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'jean@acme.io');
    await user.type(screen.getByLabelText('Mot de passe'), 'tooshort');
    await act(async () => {
      ref.current!.triggerSubmit();
    });

    await waitFor(() => expect(screen.getByText(/au moins une majuscule/i)).toBeInTheDocument());
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
