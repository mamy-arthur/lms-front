jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { role: Role; user: { role: Role } }) => unknown) =>
    selector({ role: mockCallerRole, user: { role: Role.SUPER_ADMIN } }),
}));

jest.mock('@/modules/admin/resources/tenants/api', () => ({
  tenantApi: { getAll: jest.fn() },
}));

jest.mock('@/modules/admin/resources/clients', () => ({
  ...jest.requireActual('@/modules/admin/resources/clients'),
  useClientsQuery: (_enabled: boolean, tenantId?: string | null) => ({
    data:
      mockClientsState === 'success'
        ? mockClients.filter((client) => client.tenant_id === (tenantId ?? TENANT_A))
        : mockClientsState === 'empty'
          ? []
          : undefined,
    isLoading: mockClientsState === 'loading',
    isError: mockClientsState === 'error',
    isFetching: mockClientsState === 'loading',
    refetch: mockRefetchClients,
  }),
}));

jest.mock('../../../hooks/useCreateUser', () => ({
  useCreateUser: () => ({
    mutate: mockCreate,
    mutateAsync: mockCreateAsync,
    reset: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../../hooks/useUpdateUser', () => ({
  useUpdateUser: () => ({
    mutate: mockUpdate,
    mutateAsync: mockUpdateAsync,
    reset: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/modules/shared/lib/uploadUserProfilePhoto', () => ({
  uploadUserProfilePhoto: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));

jest.mock('@modules/shared/components/users/user-profile-fields', () => ({
  UserProfileFields: () => null,
}));

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import { uploadUserProfilePhoto } from '@/modules/shared/lib/uploadUserProfilePhoto';
import { Role } from '@/shared/constants/roles';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import { MOCK_TENANTS } from '@/shared/mocks/tenant/mock-tenants';
import { normalizeUser } from '../../../types';
import { AdminUserFormDrawer } from '../admin-user-form-drawer';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const CLIENT_A = '33333333-3333-4333-8333-333333333333';
const CLIENT_B = '44444444-4444-4444-8444-444444444444';
const mockClients = [
  { id: CLIENT_A, tenant_id: TENANT_A, name: 'Client Alpha' },
  { id: CLIENT_B, tenant_id: TENANT_B, name: 'Client Beta' },
];
const mockUpdate = jest.fn();
const mockCreate = jest.fn();
const mockUpdateAsync = jest.fn();
const mockCreateAsync = jest.fn();
const mockRefetchClients = jest.fn();
let mockClientsState: 'success' | 'loading' | 'error' | 'empty' = 'success';
let mockCallerRole: Role = Role.SUPER_ADMIN;

const EXISTING_USER = normalizeUser({
  id: '55555555-5555-4555-8555-555555555555',
  tenant_id: TENANT_A,
  client_id: CLIENT_A,
  first_name: 'Alice',
  last_name: 'Test',
  email: 'alice@example.test',
  role: Role.CLIENT_MANAGER,
  is_active: true,
});

const OTHER_USER = normalizeUser({
  ...EXISTING_USER,
  id: '66666666-6666-4666-8666-666666666666',
  tenant_id: TENANT_B,
  client_id: CLIENT_B,
});

const fillCreationForm = async (interaction: ReturnType<typeof userEvent.setup>) => {
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rôle' }), { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Super admin' }));
  await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Test');
  await interaction.type(screen.getByRole('textbox', { name: 'Prénom' }), 'Alice');
  await interaction.type(screen.getByRole('textbox', { name: 'Email' }), 'alice@example.test');
  await interaction.type(screen.getByLabelText('Mot de passe', { exact: true }), 'Password123');
};

describe('AdminUserFormDrawer - rattachement client', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateAsync.mockResolvedValue({ data: EXISTING_USER });
    mockCreateAsync.mockResolvedValue({ data: EXISTING_USER });
    mockCallerRole = Role.SUPER_ADMIN;
    mockClientsState = 'success';
    jest.mocked(tenantApi.getAll).mockResolvedValue({
      data: [
        { ...MOCK_TENANTS[0], id: TENANT_A, name: 'Tenant Alpha' },
        { ...MOCK_TENANTS[1], id: TENANT_B, name: 'Tenant Beta' },
      ],
    } as unknown as Awaited<ReturnType<typeof tenantApi.getAll>>);
  });

  it.each([
    'annuler',
    'echap',
    'fermeture externe',
    'autre utilisateur',
    'reouverture du meme utilisateur',
  ])('abandonne le fichier et sa previsualisation apres %s', async (transition) => {
    const interaction = userEvent.setup();
    const onClose = jest.fn();
    const view = renderWithQueryClient(
      <AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />,
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    await interaction.upload(input!, new File(['photo-a'], 'alice.png', { type: 'image/png' }));
    expect(await screen.findByText(/Photo sélectionnée/)).toBeInTheDocument();

    if (transition === 'annuler' || transition === 'reouverture du meme utilisateur') {
      await interaction.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(onClose).toHaveBeenCalled();
    } else if (transition === 'echap') {
      await interaction.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    }
    if (transition !== 'autre utilisateur') {
      view.rerender(<AdminUserFormDrawer open={false} onClose={onClose} user={EXISTING_USER} />);
    }
    const target = transition === 'reouverture du meme utilisateur' ? EXISTING_USER : OTHER_USER;
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={target} />);

    expect(screen.queryByText(/Photo sélectionnée/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter une photo' })).toBeInTheDocument();
    expect(document.querySelector<HTMLInputElement>('input[type="file"]')?.files).toHaveLength(0);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: target.id }),
        expect.any(Object),
      ),
    );
    expect(mockUpdateAsync).not.toHaveBeenCalled();
    expect(uploadUserProfilePhoto).not.toHaveBeenCalled();
  });

  it('envoie uniquement la nouvelle photo choisie pour le second utilisateur', async () => {
    const interaction = userEvent.setup();
    const onClose = jest.fn();
    const view = renderWithQueryClient(
      <AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />,
    );
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['photo-a'], 'alice.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await interaction.click(screen.getByRole('button', { name: 'Annuler' }));
    view.rerender(<AdminUserFormDrawer open={false} onClose={onClose} />);
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={OTHER_USER} />);

    const newPhoto = new File(['photo-b'], 'bob.png', { type: 'image/png' });
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      newPhoto,
    );
    await screen.findByText(/Photo sélectionnée/);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(uploadUserProfilePhoto).toHaveBeenCalledWith(
        OTHER_USER.id,
        newPhoto,
        'platform/users',
      ),
    );
    expect(uploadUserProfilePhoto).toHaveBeenCalledTimes(1);
    expect(mockUpdateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: OTHER_USER.id }));
  });

  it('abandonne la photo d une creation annulee avant de modifier un utilisateur', async () => {
    const interaction = userEvent.setup();
    const onClose = jest.fn();
    const view = renderWithQueryClient(<AdminUserFormDrawer open onClose={onClose} />);
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['creation'], 'creation.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await interaction.click(screen.getByRole('button', { name: 'Annuler' }));
    view.rerender(<AdminUserFormDrawer open={false} onClose={onClose} />);
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);

    expect(screen.queryByText(/Photo sélectionnée/)).not.toBeInTheDocument();
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: EXISTING_USER.id }),
        expect.any(Object),
      ),
    );
    expect(uploadUserProfilePhoto).not.toHaveBeenCalled();
    expect(mockUpdateAsync).not.toHaveBeenCalled();
  });

  it('conserve la photo choisie pendant la saisie et l envoie au compte cree', async () => {
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);
    const photo = new File(['creation'], 'creation.png', { type: 'image/png' });
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      photo,
    );
    await screen.findByText(/Photo sélectionnée/);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rôle' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Super admin' }));
    await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Test');
    await interaction.type(screen.getByRole('textbox', { name: 'Prénom' }), 'Alice');
    await interaction.type(screen.getByRole('textbox', { name: 'Email' }), 'alice@example.test');
    await interaction.type(screen.getByLabelText('Mot de passe', { exact: true }), 'Password123');
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(uploadUserProfilePhoto).toHaveBeenCalledWith(
        EXISTING_USER.id,
        photo,
        'platform/users',
      ),
    );
    expect(mockCreateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.test' }),
    );
    expect(uploadUserProfilePhoto).toHaveBeenCalledTimes(1);
  });

  it("n'annonce pas un echec de creation quand la reponse n'expose pas d'id", async () => {
    mockCreateAsync.mockResolvedValue({} as unknown as { data: typeof EXISTING_USER });
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['creation'], 'creation.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await fillCreationForm(interaction);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalledWith("Échec de la création de l'utilisateur.");
    expect(uploadUserProfilePhoto).not.toHaveBeenCalled();
    expect(mockCreateAsync).toHaveBeenCalledTimes(1);
  });

  it("n'envoie pas la photo quand le PATCH est refuse", async () => {
    mockUpdateAsync.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} user={EXISTING_USER} />);
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['photo'], 'alice.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(mockUpdateAsync).toHaveBeenCalled());
    expect(uploadUserProfilePhoto).not.toHaveBeenCalled();
  });

  it('laisse la mutation notifier seule un echec de mise a jour', async () => {
    mockUpdateAsync.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} user={EXISTING_USER} />);
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['photo'], 'alice.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(mockUpdateAsync).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('empeche une seconde soumission pendant l upload de la photo', async () => {
    let releaseUpload: () => void = () => {};
    jest.mocked(uploadUserProfilePhoto).mockImplementation(
      () =>
        new Promise<never>((resolve) => {
          releaseUpload = resolve as unknown as () => void;
        }),
    );
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} user={EXISTING_USER} />);
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['photo'], 'alice.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(uploadUserProfilePhoto).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /Enregistrement/ })).toBeDisabled();

    // La soumission reprend et deverrouille le bouton : la laisser retomber ici
    // plutot qu'apres la fin du test.
    await act(async () => {
      releaseUpload();
    });
  });

  it('reste verrouille tant que le rafraichissement des listes n a pas abouti', async () => {
    jest.mocked(uploadUserProfilePhoto).mockResolvedValue({
      id: 'media-1',
      url: '/media-1',
      mime_type: 'image/png',
    });
    const interaction = userEvent.setup();
    const view = renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);

    let releaseRefresh: () => void = () => {};
    jest.spyOn(view.queryClient, 'invalidateQueries').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseRefresh = resolve;
        }),
    );

    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['creation'], 'creation.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await fillCreationForm(interaction);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(uploadUserProfilePhoto).toHaveBeenCalled());

    // L'upload est fini mais le rafraichissement traine : le bouton doit rester
    // verrouille, sinon un second clic relancerait une creation.
    const submit = screen.getByRole('button', { name: /Enregistrement/ });
    expect(submit).toBeDisabled();

    fireEvent.click(submit);
    expect(mockCreateAsync).toHaveBeenCalledTimes(1);

    // Idem : le rafraichissement libere deverrouille le bouton.
    await act(async () => {
      releaseRefresh();
    });
  });

  it('ne cree qu une fois meme si l upload echoue', async () => {
    jest.mocked(uploadUserProfilePhoto).mockRejectedValue(new Error('upload down'));
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);
    await interaction.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['creation'], 'creation.png', { type: 'image/png' }),
    );
    await screen.findByText(/Photo sélectionnée/);
    await fillCreationForm(interaction);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mockCreateAsync).toHaveBeenCalledTimes(1);
  });

  it.each([
    { caller: Role.SUPER_ADMIN, label: 'Super admin', forbidden: [] },
    { caller: Role.EDITOR, label: 'Éditeur', forbidden: ['Super admin'] },
    { caller: Role.CLIENT_MANAGER, label: 'Responsable', forbidden: ['Super admin', 'Éditeur'] },
  ])(
    'permet a $caller de creer un pair sans proposer de role superieur',
    async ({ caller, label, forbidden }) => {
      mockCallerRole = caller;
      const interaction = userEvent.setup();
      renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);

      fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rôle' }), { key: 'ArrowDown' });
      for (const forbiddenLabel of forbidden) {
        expect(screen.queryByRole('option', { name: forbiddenLabel })).not.toBeInTheDocument();
      }
      expect(screen.getByRole('option', { name: 'Stagiaire' })).toBeInTheDocument();
      fireEvent.click(await screen.findByRole('option', { name: label }));

      await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Test');
      await interaction.type(screen.getByRole('textbox', { name: 'Prénom' }), 'Alice');
      await interaction.type(screen.getByRole('textbox', { name: 'Email' }), 'alice@example.test');
      await interaction.type(screen.getByLabelText('Mot de passe', { exact: true }), 'Password123');
      await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({ role: caller, client_id: null, client_name: null }),
          expect.any(Object),
        );
      });
    },
  );

  it('refuse un role selectionne devenu superieur avant la soumission', async () => {
    const interaction = userEvent.setup();
    const view = renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rôle' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Super admin' }));
    await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Test');
    await interaction.type(screen.getByRole('textbox', { name: 'Prénom' }), 'Alice');
    await interaction.type(screen.getByRole('textbox', { name: 'Email' }), 'alice@example.test');
    await interaction.type(screen.getByLabelText('Mot de passe', { exact: true }), 'Password123');

    mockCallerRole = Role.EDITOR;
    view.rerender(<AdminUserFormDrawer open onClose={jest.fn()} />);
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByText('Vous ne pouvez pas créer un utilisateur avec ce rôle.'),
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([Role.SUPER_ADMIN, Role.EDITOR])(
    'conserve le client et permet une modification simple pour %s',
    async (role) => {
      mockCallerRole = role;
      const interaction = userEvent.setup();
      const onClose = jest.fn();
      const view = renderWithQueryClient(<AdminUserFormDrawer open={false} onClose={onClose} />);

      view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Client' })).toHaveTextContent('Client Alpha');
      });
      await interaction.clear(screen.getByRole('textbox', { name: 'Nom' }));
      await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Modifie');
      await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: EXISTING_USER.id,
            data: expect.objectContaining({ last_name: 'Modifie' }),
          }),
          expect.any(Object),
        );
      });
      expect(mockUpdate.mock.calls[0][0].data).not.toHaveProperty('client_id');
    },
  );

  it('associe le label et l erreur client au controle et le focalise apres validation', async () => {
    mockCallerRole = Role.EDITOR;
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} />);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rôle' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Responsable' }));
    await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Test');
    await interaction.type(screen.getByRole('textbox', { name: 'Prénom' }), 'Alice');
    await interaction.type(screen.getByRole('textbox', { name: 'Email' }), 'alice@example.test');
    await interaction.type(screen.getByLabelText('Mot de passe', { exact: true }), 'Password123');

    const control = screen.getByRole('combobox', { name: 'Client' });
    const label = screen.getByText('Client', { selector: 'label' });
    expect(label).toHaveAttribute('for', control.id);
    expect(control.id).not.toBe('');

    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Nom du client requis')).toBeInTheDocument();
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('Nom du client requis');
    await waitFor(() => expect(control).toHaveFocus());
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each(['stagiaire', 'responsable', 'edition'])(
    'affiche une panne et permet de recharger les clients en %s',
    async (mode) => {
      mockCallerRole = Role.EDITOR;
      mockClientsState = 'error';
      const interaction = userEvent.setup();
      const props = {
        open: true,
        onClose: jest.fn(),
        user: mode === 'edition' ? EXISTING_USER : undefined,
      };
      const view = renderWithQueryClient(<AdminUserFormDrawer {...props} />);
      if (mode === 'responsable') {
        fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rôle' }), { key: 'ArrowDown' });
        fireEvent.click(await screen.findByRole('option', { name: 'Responsable' }));
      }

      expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger les clients.');
      expect(screen.getByRole('combobox', { name: 'Client' })).toBeDisabled();
      expect(screen.queryByText(/Aucun client/)).not.toBeInTheDocument();
      await interaction.click(screen.getByRole('button', { name: 'Réessayer' }));
      expect(mockRefetchClients).toHaveBeenCalledTimes(1);

      mockClientsState = 'success';
      view.rerender(<AdminUserFormDrawer {...props} onClose={jest.fn()} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Client' })).toBeEnabled();
    },
  );

  it('distingue chargement et catalogue vide', () => {
    mockCallerRole = Role.EDITOR;
    mockClientsState = 'loading';
    const props = { open: true, onClose: jest.fn() };
    const view = renderWithQueryClient(<AdminUserFormDrawer {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des clients');
    expect(screen.getByRole('combobox', { name: 'Client' })).toBeDisabled();
    expect(screen.queryByText(/Aucun client/)).not.toBeInTheDocument();

    mockClientsState = 'empty';
    view.rerender(<AdminUserFormDrawer {...props} onClose={jest.fn()} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun client dans ce tenant/)).toBeInTheDocument();
  });

  it('conserve le client apres fermeture et reouverture', async () => {
    const interaction = userEvent.setup();
    const onClose = jest.fn();
    const view = renderWithQueryClient(<AdminUserFormDrawer open={false} onClose={onClose} />);
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);
    await interaction.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalled();
    view.rerender(<AdminUserFormDrawer open={false} onClose={onClose} />);
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Client' })).toHaveTextContent('Client Alpha');
    });
  });

  it('charge le client du nouvel utilisateur sans le remettre a zero', async () => {
    const onClose = jest.fn();
    const view = renderWithQueryClient(
      <AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />,
    );
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={OTHER_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Client' })).toHaveTextContent('Client Beta');
    });
  });

  it.each([
    { role: Role.CLIENT_MANAGER, clientId: CLIENT_A },
    { role: Role.CLIENT_MANAGER, clientId: null },
    { role: Role.TRAINEE, clientId: CLIENT_A },
    { role: Role.TRAINEE, clientId: null },
  ])(
    'exige un client apres changement de tenant pour $role avec client initial $clientId',
    async ({ role, clientId }) => {
      const interaction = userEvent.setup();
      const user = { ...EXISTING_USER, role, client_id: clientId };
      renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} user={user} />);
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Tenant' })).toHaveTextContent('Tenant Alpha');
      });

      fireEvent.keyDown(screen.getByRole('combobox', { name: 'Tenant' }), { key: 'ArrowDown' });
      fireEvent.click(await screen.findByRole('option', { name: 'Tenant Beta' }));
      await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

      expect(await screen.findByText('Client requis')).toBeInTheDocument();
      expect(mockUpdate).not.toHaveBeenCalled();

      fireEvent.keyDown(screen.getByRole('combobox', { name: 'Client' }), { key: 'ArrowDown' });
      fireEvent.click(await screen.findByRole('option', { name: 'Client Beta' }));
      await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ role, tenant_id: TENANT_B, client_id: CLIENT_B }),
          }),
          expect.any(Object),
        );
      });
    },
  );

  it.each([Role.CLIENT_MANAGER, Role.TRAINEE])(
    'permet une edition simple du compte historique %s sans client',
    async (role) => {
      const interaction = userEvent.setup();
      const user = { ...EXISTING_USER, role, client_id: null };
      renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} user={user} />);

      await interaction.clear(screen.getByRole('textbox', { name: 'Nom' }));
      await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Modifie');
      await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: user.id,
            data: expect.objectContaining({ last_name: 'Modifie', role, tenant_id: TENANT_A }),
          }),
          expect.any(Object),
        );
      });
      expect(mockUpdate.mock.calls[0][0].data).not.toHaveProperty('client_id');
      expect(screen.queryByText('Client requis')).not.toBeInTheDocument();
    },
  );
});
