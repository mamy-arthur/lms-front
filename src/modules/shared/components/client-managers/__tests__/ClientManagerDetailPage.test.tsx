import type { ReactElement } from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { User } from '@/modules/admin/resources/users/types';
import { clientManagerDetailApi } from '@/shared/api/client-manager-detail.api';
import { traineeDetailApi } from '@/shared/api/trainee-detail.api';
import { Role } from '@/shared/constants/roles';
import { normalizeUser } from '@/shared/lib/normalizeUser';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type {
  ClientManagerPurchasedLearningPath,
  ClientManagerPurchasesResponse,
} from '@/shared/types/client-manager-detail.types';
import type { UserDetailArea } from '@/shared/types/user-detail.types';
import { useUserDetailDrawer } from '../../../hooks/useUserDetailDrawer';
import { useTraineeDetailDrawer } from '../../../hooks/useTraineeDetailDrawer';
import { TraineeDetailDrawer } from '../../trainees/TraineeDetailDrawer';
import type { UserDetailEditFormProps } from '../../users/UserDetailDrawer';
import { ClientManagerDetailPage } from '../ClientManagerDetailPage';
import { ClientManagerDetailDrawer } from '../ClientManagerDetailDrawer';

jest.mock('@/shared/api/client-manager-detail.api', () => ({
  clientManagerDetailApi: { profile: jest.fn(), purchases: jest.fn() },
}));
jest.mock('@/shared/api/trainee-detail.api', () => ({
  traineeDetailApi: { profile: jest.fn(), enrollments: jest.fn() },
}));

const api = jest.mocked(clientManagerDetailApi);
const traineeApi = jest.mocked(traineeDetailApi);
const onEdit = jest.fn();
const manager = normalizeUser({
  id: 'manager-1',
  full_name: 'Bob Martin',
  email: 'bob@example.test',
  role: Role.CLIENT_MANAGER,
});
const trainee = normalizeUser({ id: 'trainee-1', full_name: 'Alice Dupont', role: Role.TRAINEE });
const actor = { id: 'actor', name: 'Éditeur', email: 'actor@example.test', role: Role.EDITOR };
const tenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme',
  domain: 'acme.example.test',
  status: 'active' as const,
  is_active: true,
  features: { certificates: false, liveSession: false, customDomain: false },
};
const purchase: ClientManagerPurchasedLearningPath = {
  id: 'achat-1',
  created_at: '2026-10-01T10:00:00Z',
  modules_count: 7,
  evaluations_count: 2,
  learning_path: {
    id: 'formation-1',
    name: 'Sécurité au travail',
    description: 'Prévenir les risques.',
    image: { id: 'image-1', url: '/formation.png', mime_type: 'image/png' },
    category_id: 'category-1',
    category_name: 'Prévention',
  },
};
const defaults = { page: 1, per_page: 20, q: '', sort_by: 'created_at', sort_dir: 'desc' };
const clients: QueryClient[] = [];
const areas = ['admin', 'portal'] as const;

function response(
  data: ClientManagerPurchasedLearningPath[] = [],
  page = 1,
  total = data.length,
): ClientManagerPurchasesResponse {
  return { data, meta: { total, page, per_page: 20 } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function mount(
  element: ReactElement = <ClientManagerDetailPage id={manager.id} area="portal" onEdit={onEdit} />,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0, gcTime: Infinity } },
  });
  clients.push(client);
  return {
    client,
    ...render(element, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }),
  };
}

function EditForm({ open, user, onClose, onSuccess, onCloseAutoFocus }: UserDetailEditFormProps) {
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent onCloseAutoFocus={onCloseAutoFocus}>
        <SheetTitle>Formulaire injecté</SheetTitle>
        <SheetDescription>{user?.full_name}</SheetDescription>
        <button onClick={onSuccess}>Enregistrer</button>
        <button onClick={onClose}>Annuler</button>
      </SheetContent>
    </Sheet>
  );
}

function Harness({
  area = 'portal',
  routeByRole = false,
}: {
  area?: UserDetailArea;
  routeByRole?: boolean;
}) {
  const path = area === 'admin' ? '/admin/users' : '/users';
  const managerDrawer = useUserDetailDrawer(path, 'manager');
  const traineeDrawer = useTraineeDetailDrawer(path);
  const onRoleMismatch = routeByRole
    ? (user: User) =>
        user.role === Role.CLIENT_MANAGER
          ? managerDrawer.open(user.id)
          : traineeDrawer.open(user.id)
    : undefined;
  return (
    <>
      <button data-user-detail-trigger={manager.id} onClick={() => managerDrawer.open(manager.id)}>
        Ouvrir responsable
      </button>
      <button data-user-detail-trigger={trainee.id} onClick={() => traineeDrawer.open(trainee.id)}>
        Ouvrir stagiaire
      </button>
      <ClientManagerDetailDrawer
        key={`manager:${traineeDrawer.id ?? ''}`}
        id={managerDrawer.id}
        area={area}
        editForm={EditForm}
        onClose={managerDrawer.close}
        onCloseAutoFocus={managerDrawer.restoreFocus}
        onRoleMismatch={onRoleMismatch}
      />
      <TraineeDetailDrawer
        key={`trainee:${managerDrawer.id ?? ''}`}
        id={traineeDrawer.id}
        area={area}
        editForm={EditForm}
        onClose={traineeDrawer.close}
        onCloseAutoFocus={traineeDrawer.restoreFocus}
        onRoleMismatch={onRoleMismatch}
      />
    </>
  );
}

function navigate(url: string) {
  act(() => {
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(actor, 'session-1');
  useTenantStore.getState().setTenant(tenant);
  api.profile.mockResolvedValue({ data: manager });
  api.purchases.mockResolvedValue(response());
  traineeApi.profile.mockResolvedValue({ data: trainee });
  traineeApi.enrollments.mockResolvedValue({ data: [], meta: { total: 0, page: 1, per_page: 20 } });
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  useAuthStore.getState().clearAuth();
  useTenantStore.getState().clearTenant();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  jest.useRealTimers();
});

describe('Profil et autorisation', () => {
  it.each(areas)('valide le profil %s avant de charger les achats', async (area) => {
    const pending = deferred<{ data: User }>();
    api.profile.mockReturnValue(pending.promise);
    mount(<ClientManagerDetailPage id={manager.id} area={area} onEdit={onEdit} />);
    expect(screen.getByRole('region', { name: 'Profil du responsable' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(api.profile).toHaveBeenCalledWith(area, manager.id, expect.any(AbortSignal));
    expect(api.purchases).not.toHaveBeenCalled();
    await act(async () => pending.resolve({ data: manager }));
    expect(await screen.findByRole('heading', { name: manager.full_name })).toBeVisible();
    expect(await screen.findByText('Aucune formation achetée.')).toBeVisible();
    expect(api.purchases).toHaveBeenCalledWith(area, manager.id, defaults, expect.any(AbortSignal));
    expect(api.profile).toHaveBeenCalledTimes(1);
    expect(api.purchases).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region', { name: 'Profil du responsable' })).toHaveClass(
      'rounded-sm',
      'p-3',
      'sm:p-5',
    );
    expect(screen.getByRole('link', { name: manager.email })).toHaveAttribute(
      'href',
      `mailto:${manager.email}`,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Modifier le responsable' }));
    expect(onEdit).toHaveBeenCalledWith(manager);
  });

  it.each([Role.TRAINEE, Role.EDITOR, Role.SUPER_ADMIN, undefined, null, 'client_manager'])(
    'refuse le rôle brut %s',
    async (role) => {
      api.profile.mockResolvedValue({ data: { ...manager, role } } as { data: User });
      mount();
      expect(await screen.findByRole('heading', { name: 'Responsable introuvable' })).toBeVisible();
      expect(api.purchases).not.toHaveBeenCalled();
      expect(api.profile).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('button', { name: 'Modifier le responsable' }),
      ).not.toBeInTheDocument();
    },
  );

  it.each([null, undefined])('refuse un profil absent %s', async (data) => {
    api.profile.mockResolvedValue({ data } as unknown as { data: User });
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger le profil.');
    expect(api.purchases).not.toHaveBeenCalled();
  });

  it.each([
    [403, 'Vous n’avez pas accès à ce profil.'],
    [404, 'Responsable introuvable'],
    [500, 'Impossible de charger le profil.'],
  ] as const)('gère le profil %s sans achats', async (status, message) => {
    api.profile.mockRejectedValue(Object.assign(new Error('Erreur'), { status }));
    mount();
    expect(await screen.findByText(message)).toBeVisible();
    expect(api.profile).toHaveBeenCalledTimes(status === 500 ? 2 : 1);
    expect(api.purchases).not.toHaveBeenCalled();
    if (status === 500) {
      api.profile.mockResolvedValue({ data: manager });
      await userEvent.click(screen.getByRole('button', { name: 'Réessayer le profil' }));
      expect(await screen.findByText('Aucune formation achetée.')).toBeVisible();
    } else expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument();
  });

  it('garde les valeurs de remplacement du profil sans inventer de dates', async () => {
    api.profile.mockResolvedValue({ data: { id: manager.id, role: Role.CLIENT_MANAGER } as User });
    mount();
    await screen.findByRole('heading', { name: 'Responsable indisponible' });
    const profile = screen.getByRole('region', { name: 'Profil du responsable' });
    expect(within(profile).getByText('E-mail indisponible')).toBeVisible();
    expect(within(profile).getAllByText('—')).toHaveLength(2);
    expect(profile.querySelector('time')).toBeNull();
  });

  it.each([Role.TRAINEE, null])(
    'n’envoie aucune requête pour un acteur interdit %s',
    async (role) => {
      useAuthStore.setState({ role });
      mount();
      expect(screen.getByRole('alert')).toHaveTextContent('Vous n’avez pas accès à cette page.');
      expect(api.profile).not.toHaveBeenCalled();
      expect(api.purchases).not.toHaveBeenCalled();
    },
  );
});

describe('Achats et filtres', () => {
  it('affiche des achats distincts, les compteurs zéro et une formation supprimée sans détails supplémentaires', async () => {
    api.purchases.mockResolvedValue(
      response([
        purchase,
        { ...purchase, id: 'achat-2', modules_count: 0, evaluations_count: 0 },
        { ...purchase, id: 'achat-3', learning_path: null, modules_count: 0, evaluations_count: 0 },
      ]),
    );
    mount();
    const list = await screen.findByRole('list', { name: 'Formations du responsable' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(list).getAllByRole('article', { name: 'Sécurité au travail' })).toHaveLength(2);
    expect(within(rows[0]).getByText('Prévenir les risques.')).toBeVisible();
    expect(within(rows[0]).getByText('Prévention')).toBeVisible();
    expect(
      within(rows[0])
        .getAllByRole('term')
        .map((node) => node.textContent),
    ).toEqual(['Modules', 'Évaluations']);
    expect(
      within(rows[0])
        .getAllByRole('definition')
        .map((node) => node.textContent),
    ).toEqual(['7', '2']);
    expect(
      within(rows[1])
        .getAllByRole('definition')
        .map((node) => node.textContent),
    ).toEqual(['0', '0']);
    expect(within(rows[2]).getByRole('article', { name: 'Formation indisponible' })).toBeVisible();
    expect(within(list).queryByRole('button')).not.toBeInTheDocument();
    expect(within(list).queryByRole('link')).not.toBeInTheDocument();
    expect(
      within(list).queryByText(/crédit|note|statut|progression|inscription/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /statut/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Trier par')).not.toBeInTheDocument();
    expect(screen.getByText('3 achats · Page 1 sur 1')).toBeVisible();
  });

  it.each([403, 404, 500])('préserve le profil lorsque les achats répondent %s', async (status) => {
    api.purchases.mockRejectedValue(Object.assign(new Error('Erreur achats'), { status }));
    mount();
    await screen.findByRole('alert');
    expect(screen.getByRole('heading', { name: manager.full_name })).toBeVisible();
    expect(screen.queryByText('Aucune formation achetée.')).not.toBeInTheDocument();
    expect(api.purchases).toHaveBeenCalledTimes(status === 500 ? 2 : 1);
    if (status === 500) {
      api.purchases.mockResolvedValue(response([purchase]));
      await userEvent.click(screen.getByRole('button', { name: 'Réessayer les formations' }));
      expect(await screen.findByRole('article')).toBeVisible();
      expect(api.profile).toHaveBeenCalledTimes(1);
    } else expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument();
  });

  it('recherche avec debounce, remet la page à un et réinitialise les résultats vides', async () => {
    jest.useFakeTimers();
    const interaction = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    api.purchases.mockImplementation(async (_area, _id, params) =>
      response(params.q ? [] : [purchase], params.page, params.q ? 0 : 41),
    );
    mount();
    await screen.findByRole('article');
    await interaction.click(screen.getByRole('button', { name: 'Suivant' }));
    await screen.findByText('41 achats · Page 2 sur 3');
    const search = screen.getByRole('searchbox', { name: 'Rechercher une formation' });
    await interaction.type(search, '  inconnu  ');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(api.purchases.mock.calls.some((call) => call[2].q === 'inconnu')).toBe(false);
    await act(async () => jest.advanceTimersByTimeAsync(400));
    expect(api.purchases).toHaveBeenLastCalledWith(
      'portal',
      manager.id,
      { ...defaults, q: 'inconnu' },
      expect.any(AbortSignal),
    );
    expect(await screen.findByText('Aucune formation ne correspond à la recherche.')).toBeVisible();
    await interaction.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    await act(async () => jest.advanceTimersByTimeAsync(400));
    await screen.findByRole('article');
    expect(search).toHaveValue('');
    expect(api.purchases).toHaveBeenLastCalledWith(
      'portal',
      manager.id,
      defaults,
      expect.any(AbortSignal),
    );
  });

  it('trie par nom puis achat récent et pagine sans toucher au profil', async () => {
    api.purchases.mockImplementation(async (_area, _id, params) =>
      response([purchase], params.page, 41),
    );
    mount();
    await screen.findByRole('article');
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    await screen.findByText('41 achats · Page 2 sur 3');
    await userEvent.click(screen.getByRole('combobox', { name: 'Trier par' }));
    await userEvent.click(screen.getByRole('option', { name: 'Nom de formation' }));
    await screen.findByText('41 achats · Page 1 sur 3');
    expect(api.purchases).toHaveBeenLastCalledWith(
      'portal',
      manager.id,
      { ...defaults, sort_by: 'name', sort_dir: 'asc' },
      expect.any(AbortSignal),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    await screen.findByText('41 achats · Page 2 sur 3');
    await userEvent.click(screen.getByRole('button', { name: 'Précédent' }));
    await screen.findByText('41 achats · Page 1 sur 3');
    await userEvent.click(screen.getByRole('combobox', { name: 'Trier par' }));
    await userEvent.click(screen.getByRole('option', { name: 'Achat le plus récent' }));
    await waitFor(() =>
      expect(api.purchases).toHaveBeenLastCalledWith(
        'portal',
        manager.id,
        defaults,
        expect.any(AbortSignal),
      ),
    );
    expect(api.profile).toHaveBeenCalledTimes(1);
  });

  it('distingue une liste vide et une page devenue vide', async () => {
    const view = mount();
    expect(await screen.findByText('Aucune formation achetée.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    api.purchases.mockImplementation(async (_area, _id, params) =>
      response(params.page === 1 ? [purchase] : [], params.page, 21),
    );
    await act(async () => {
      await view.client.invalidateQueries();
    });
    await screen.findByRole('article');
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(await screen.findByText('Aucun achat sur cette page.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(await screen.findByRole('article')).toBeVisible();
  });
});

describe('Drawer, historique et édition exclusive', () => {
  it.each(areas)('ouvre et ferme le drawer %s en conservant URL, ancre et focus', async (area) => {
    const path = area === 'admin' ? '/admin/users' : '/users';
    const url = `${path}?q=Bob&roles=CLIENT_MANAGER&page=3&view=compact#resultats`;
    window.history.replaceState(null, '', url);
    mount(<Harness area={area} />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir responsable' });
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Détail du responsable' });
    expect(dialog).toHaveClass('w-full!', 'sm:w-[60vw]!');
    await within(dialog).findByRole('heading', { name: manager.full_name });
    expect(new URLSearchParams(window.location.search).get('manager')).toBe(manager.id);
    expect(window.location.hash).toBe('#resultats');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(url);
    expect(trigger).toHaveFocus();
  });

  it('ne laisse pas d’entrée d’historique en double après ouverture puis fermeture', async () => {
    window.history.pushState({ marker: 'liste' }, '', '/users?q=Bob');
    mount(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir responsable' }));
    await screen.findByRole('heading', { name: manager.full_name });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.history.state).toMatchObject({ marker: 'liste' });
    expect(window.location.search).toBe('?q=Bob');
  });

  it('ferme sans quitter la page lorsque le détail vient d’un lien direct', async () => {
    window.history.pushState({ marker: 'externe' }, '', '/users?manager=manager-1');
    mount(<Harness />);
    await screen.findByRole('heading', { name: manager.full_name });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.location.pathname + window.location.search).toBe('/users');
    expect(window.history.state?.userDetailOpenedByList).toBeUndefined();
  });

  it('ouvre depuis l’URL, annule à la fermeture par historique et revalide au retour', async () => {
    window.history.replaceState(null, '', '/users?manager=manager-1');
    api.profile.mockReturnValueOnce(deferred<{ data: User }>().promise);
    mount(<Harness />);
    const signal = api.profile.mock.calls[0][2];
    navigate('/users');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(signal?.aborted).toBe(true);
    navigate('/users?manager=manager-1');
    await screen.findByRole('heading', { name: manager.full_name });
    expect(api.profile).toHaveBeenCalledTimes(2);
  });

  it('ne cumule pas les drawers même avec deux cibles dans l’URL', async () => {
    window.history.replaceState(null, '', '/users?trainee=trainee-1&manager=manager-1');
    mount(<Harness />);
    await screen.findByRole('heading', { name: manager.full_name });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(traineeApi.profile).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer le détail du responsable' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.location.search).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir stagiaire' }));
    await screen.findByRole('heading', { name: trainee.full_name });
    navigate('/users?manager=manager-1');
    await screen.findByRole('heading', { name: manager.full_name });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it.each(['Annuler', 'Enregistrer'])(
    'ferme le détail avant édition et retourne à la liste après %s',
    async (action) => {
      window.history.replaceState(null, '', '/users?q=Bob#resultats');
      const { client } = mount(<Harness />);
      const invalidate = jest.spyOn(client, 'invalidateQueries');
      const trigger = screen.getByRole('button', { name: 'Ouvrir responsable' });
      await userEvent.click(trigger);
      await userEvent.click(await screen.findByRole('button', { name: 'Modifier le responsable' }));
      await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
      expect(screen.getByRole('dialog', { name: 'Formulaire injecté' })).toHaveTextContent(
        manager.full_name,
      );
      expect(
        screen.queryByRole('dialog', { name: 'Détail du responsable' }),
      ).not.toBeInTheDocument();
      expect(window.location.search + window.location.hash).toBe('?q=Bob#resultats');
      await userEvent.click(screen.getByRole('button', { name: action }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
      if (action === 'Enregistrer')
        expect(invalidate).toHaveBeenCalledWith({
          queryKey: expect.arrayContaining(['client-manager-detail', 'portal', manager.id]),
        });
      else expect(invalidate).not.toHaveBeenCalled();
    },
  );

  it('supprime l’édition responsable si l’historique ouvre un stagiaire', async () => {
    window.history.replaceState(null, '', '/users?manager=manager-1');
    mount(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Modifier le responsable' }));
    expect(screen.getByRole('dialog', { name: 'Formulaire injecté' })).toBeVisible();
    navigate('/users?trainee=trainee-1');
    await screen.findByRole('heading', { name: trainee.full_name });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    navigate('/users');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('bascule sur le détail responsable quand un lien profond vise le mauvais rôle', async () => {
    traineeApi.profile.mockResolvedValue({ data: manager });
    window.history.replaceState(null, '', '/users?trainee=manager-1');
    mount(<Harness routeByRole />);
    expect(await screen.findByRole('heading', { name: manager.full_name })).toBeVisible();
    expect(window.location.search).toBe('?manager=manager-1');
    expect(
      screen.queryByRole('heading', { name: 'Stagiaire introuvable' }),
    ).not.toBeInTheDocument();
    expect(api.profile).toHaveBeenCalledWith('portal', manager.id, expect.any(AbortSignal));
  });

  it('garde l’écran introuvable si l’hôte ne sait pas rerouter le rôle', async () => {
    traineeApi.profile.mockResolvedValue({ data: manager });
    window.history.replaceState(null, '', '/users?trainee=manager-1');
    mount(<Harness />);
    expect(await screen.findByRole('heading', { name: 'Stagiaire introuvable' })).toBeVisible();
    expect(window.location.search).toBe('?trainee=manager-1');
  });
});

describe('Cache, réautorisation et périmètre', () => {
  it('masque le cache tant que le profil n’est pas revalidé puis refuse un accès révoqué', async () => {
    window.history.replaceState(null, '', '/users?manager=manager-1');
    api.purchases.mockResolvedValue(response([purchase]));
    mount(<Harness />);
    await screen.findByRole('article');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const pending = deferred<{ data: User }>();
    api.profile.mockReturnValueOnce(pending.promise);
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir responsable' }));
    expect(screen.queryByRole('heading', { name: manager.full_name })).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(api.purchases).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ data: trainee }));
    expect(await screen.findByRole('heading', { name: 'Responsable introuvable' })).toBeVisible();
    expect(api.purchases).toHaveBeenCalledTimes(1);
  });

  it('revalide également les achats en cache et masque ceux devenus interdits', async () => {
    window.history.replaceState(null, '', '/users?manager=manager-1');
    api.purchases.mockResolvedValueOnce(response([purchase]));
    mount(<Harness />);
    await screen.findByRole('article');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    api.purchases.mockRejectedValue(Object.assign(new Error('Interdit'), { status: 403 }));
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir responsable' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vous n’avez pas accès à ces formations.',
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(api.profile).toHaveBeenCalledTimes(2);
  });

  it.each(['tenant', 'acteur', 'session', 'rôle', 'cible', 'zone'])(
    'isole le cache et réinitialise la recherche lors du changement de %s',
    async (change) => {
      api.purchases.mockResolvedValue(response([purchase]));
      const view = mount();
      await screen.findByRole('article');
      await userEvent.type(screen.getByRole('searchbox'), 'recherche');
      await waitFor(() => expect(api.purchases.mock.calls.at(-1)?.[2].q).toBe('recherche'));
      const pending = deferred<{ data: User }>();
      api.profile.mockReturnValue(pending.promise);
      if (change === 'cible' || change === 'zone') {
        view.rerender(
          <ClientManagerDetailPage
            id={change === 'cible' ? 'manager-2' : manager.id}
            area={change === 'zone' ? 'admin' : 'portal'}
            onEdit={onEdit}
          />,
        );
      } else
        act(() => {
          if (change === 'tenant')
            useTenantStore.getState().setTenant({ ...tenant, id: 'tenant-2' });
          if (change === 'acteur') useAuthStore.getState().setAuth({ ...actor, id: 'actor-2' });
          if (change === 'session') useAuthStore.setState({ sessionId: 'session-2' });
          if (change === 'rôle') useAuthStore.setState({ role: Role.SUPER_ADMIN });
        });
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: manager.full_name })).not.toBeInTheDocument();
      await act(async () =>
        pending.resolve({
          data: { ...manager, id: change === 'cible' ? 'manager-2' : manager.id },
        }),
      );
      await screen.findByRole('article');
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(api.profile).toHaveBeenCalledTimes(2);
      expect(api.purchases.mock.calls.at(-1)?.[2]).toEqual(defaults);
    },
  );

  it('annule les achats au changement de périmètre et ferme une édition lors de la déconnexion', async () => {
    window.history.replaceState(null, '', '/users?manager=manager-1');
    api.purchases.mockReturnValueOnce(deferred<ClientManagerPurchasesResponse>().promise);
    mount(<Harness />);
    await screen.findByRole('heading', { name: manager.full_name });
    const signal = api.purchases.mock.calls[0][3];
    act(() => useTenantStore.getState().setTenant({ ...tenant, id: 'tenant-2' }));
    await screen.findByText('Aucune formation achetée.');
    expect(signal?.aborted).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier le responsable' }));
    act(() => useAuthStore.getState().clearAuth());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
