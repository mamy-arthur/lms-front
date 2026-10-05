import type { ReactElement } from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import AdminPage from '@/app/(admin)/admin/(protected)/trainees/[id]/page';
import PortalPage from '@/app/(portal)/users/[id]/page';
import { normalizeUser, type User } from '@/modules/admin/resources/users/types';
import { traineeDetailApi } from '@/shared/api/trainee-detail.api';
import { Role } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type {
  TraineeEnrollment,
  TraineeEnrollmentsResponse,
} from '@/shared/types/trainee-detail.types';
import { TraineeDetailPage } from '../TraineeDetailPage';
import { TraineeDetailDrawer } from '../TraineeDetailDrawer';
import { useTraineeDetailDrawer } from '@/modules/shared/hooks/useTraineeDetailDrawer';

jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

jest.mock('@/shared/api/trainee-detail.api', () => ({
  traineeDetailApi: { profile: jest.fn(), enrollments: jest.fn() },
}));

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: User;
};

// Intégration de la page uniquement : ce formulaire accessible simule le contrat
// save/close des drawers, pas leur validation, leurs mutations ni leur focus trap.
function DrawerStub({ open, onClose, onSuccess, user, area }: DrawerProps & { area: string }) {
  if (!open) return null;
  return (
    <form
      aria-label={`Formulaire de test ${area}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSuccess?.();
      }}
    >
      <label>
        Nom du stagiaire
        <input defaultValue={user?.full_name} />
      </label>
      <button type="submit">Enregistrer</button>
      <button type="button" onClick={onClose}>
        Fermer
      </button>
    </form>
  );
}

const api = jest.mocked(traineeDetailApi);
const AdminEditForm = (props: DrawerProps) => <DrawerStub {...props} area="admin" />;
const PortalEditForm = (props: DrawerProps) => <DrawerStub {...props} area="portal" />;
const onEdit = jest.fn();
const target = normalizeUser({
  id: 'stagiaire-1',
  full_name: 'Alice Dupont',
  email: 'alice@example.test',
  role: Role.TRAINEE,
});
const actor = {
  id: 'gestionnaire-1',
  name: 'Gestionnaire',
  email: 'gestionnaire@example.test',
  role: Role.CLIENT_MANAGER,
};
const tenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme',
  domain: 'acme.example.test',
  status: 'active' as const,
  is_active: true,
  features: { certificates: false, liveSession: false, customDomain: false },
};
const enrollment: TraineeEnrollment = {
  id: 'inscription-1',
  status: 'in_progress',
  progress_percent: 37,
  completed_modules: 2,
  total_modules: 6,
  time_spent_seconds: 3661,
  enrolled_at: '2026-09-01T10:00:00Z',
  started_at: null,
  completed_at: null,
  failed_at: null,
  failure_reason: null,
  expires_at: null,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
  learning_path: {
    id: 'formation-1',
    name: 'Formation initiale',
    description: null,
    image: null,
    duration: 90,
    totalModules: 8,
    category_learning_path: null,
  },
};
const defaults = {
  page: 1,
  per_page: 20,
  q: '',
  status: undefined,
  sort_by: 'enrolled_at',
  sort_dir: 'desc',
};
const areas = ['admin', 'portal'] as const;
const clients: QueryClient[] = [];

function response(
  data: TraineeEnrollment[] = [],
  page = 1,
  total = data.length,
): TraineeEnrollmentsResponse {
  return { data, meta: { page, per_page: 20, total } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function mount(
  element: ReactElement = <TraineeDetailPage id={target.id} area="portal" onEdit={onEdit} />,
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

function DrawerHarness({ area = 'portal' }: { area?: 'admin' | 'portal' }) {
  const drawer = useTraineeDetailDrawer(area === 'admin' ? '/admin/users' : '/users');
  return (
    <>
      <button data-user-detail-trigger={target.id} onClick={() => drawer.open(target.id)}>
        Ouvrir le détail
      </button>
      <TraineeDetailDrawer
        id={drawer.id}
        area={area}
        editForm={area === 'admin' ? AdminEditForm : PortalEditForm}
        onClose={drawer.close}
        onCloseAutoFocus={drawer.restoreFocus}
      />
    </>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth(actor, 'session-1');
  useTenantStore.getState().setTenant(tenant);
  api.profile.mockResolvedValue({ data: target });
  api.enrollments.mockResolvedValue(response());
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

describe('Chargement direct et navigation', () => {
  it.each(areas)(
    'charge le détail %s sans données de liste et attend la validation du profil',
    async (area) => {
      useAuthStore
        .getState()
        .setAuth({ ...actor, role: area === 'admin' ? Role.EDITOR : Role.CLIENT_MANAGER });
      const pending = deferred<{ data: User }>();
      api.profile.mockReturnValue(pending.promise);
      mount(<TraineeDetailPage id={target.id} area={area} onEdit={onEdit} />);
      expect(screen.getByRole('status')).toHaveTextContent('Chargement du profil');
      expect(screen.getByRole('region', { name: 'Profil du stagiaire' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
      expect(api.profile).toHaveBeenCalledWith(area, target.id, expect.any(AbortSignal));
      expect(api.enrollments).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('button', { name: 'Modifier le stagiaire' }),
      ).not.toBeInTheDocument();
      await act(async () => pending.resolve({ data: target }));
      expect(await screen.findByRole('heading', { name: target.full_name })).toBeVisible();
      expect(await screen.findByText('Aucune inscription.')).toBeVisible();
      expect(api.enrollments).toHaveBeenCalledWith(
        area,
        target.id,
        defaults,
        expect.any(AbortSignal),
      );
      expect(api.profile).toHaveBeenCalledTimes(1);
      expect(api.enrollments).toHaveBeenCalledTimes(1);
    },
  );

  it.each(areas)('préserve les filtres de retour autorisés dans la route %s', async (area) => {
    const Page = area === 'admin' ? AdminPage : PortalPage;
    const returnTo = `${area === 'admin' ? '/admin/users' : '/users'}?q=Alice&page=3&roles=TRAINEE`;
    await Page({
      params: Promise.resolve({ id: target.id }),
      searchParams: Promise.resolve({ returnTo }),
    });
    expect(redirect).toHaveBeenCalledWith(`${returnTo}&trainee=${target.id}`);
    expect(api.profile).not.toHaveBeenCalled();
  });

  it.each(areas)('rejette les retours externes ou ambigus dans la route %s', async (area) => {
    const Page = area === 'admin' ? AdminPage : PortalPage;
    const fallback = area === 'admin' ? '/admin/users' : '/users';
    for (const returnTo of [
      undefined,
      'https://evil.example/users',
      '//evil.example/users',
      'javascript:alert(1)',
      '/users/../outside',
      '/admin/users/../outside',
      ['/users?q=a', '/users?q=b'],
    ]) {
      await Page({
        params: Promise.resolve({ id: target.id }),
        searchParams: Promise.resolve({ returnTo }),
      });
      expect(redirect).toHaveBeenLastCalledWith(`${fallback}?trainee=${target.id}`);
    }
  });

  it('encode la cible dans les deux liens de détail', () => {
    expect(ROUTES.admin.traineeDetail('élève/a ?#%')).toBe(
      '/admin/trainees/%C3%A9l%C3%A8ve%2Fa%20%3F%23%25',
    );
    expect(ROUTES.portal.traineeDetail('élève/a ?#%')).toBe(
      '/users/%C3%A9l%C3%A8ve%2Fa%20%3F%23%25',
    );
  });
});

describe('Drawer de détail du stagiaire', () => {
  it.each(areas)(
    'ouvre et ferme le drawer %s sans quitter la liste ni perdre les filtres',
    async (area) => {
      const path = area === 'admin' ? '/admin/users' : '/users';
      window.history.replaceState(null, '', `${path}?q=Alice&page=3`);
      mount(<DrawerHarness area={area} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(api.profile).not.toHaveBeenCalled();
      const trigger = screen.getByRole('button', { name: 'Ouvrir le détail' });
      await userEvent.click(trigger);
      const dialog = screen.getByRole('dialog', { name: 'Détail du stagiaire' });
      expect(dialog).toHaveClass('sm:w-[60vw]!', 'w-full!');
      expect(await within(dialog).findByRole('heading', { name: target.full_name })).toBeVisible();
      expect(window.location.pathname).toBe(path);
      expect(new URLSearchParams(window.location.search).get('trainee')).toBe(target.id);
      expect(api.profile).toHaveBeenCalledWith(area, target.id, expect.any(AbortSignal));
      await userEvent.click(screen.getByRole('button', { name: 'Fermer le détail du stagiaire' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(window.location.pathname + window.location.search).toBe(`${path}?q=Alice&page=3`);
      expect(trigger).toHaveFocus();
    },
  );

  it('ouvre le drawer depuis l’URL et le ferme avec Échap', async () => {
    window.history.replaceState(null, '', `/users?page=2&trainee=${target.id}`);
    mount(<DrawerHarness />);
    await screen.findByRole('heading', { name: target.full_name });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.location.search).toBe('?page=2');
    expect(screen.getByRole('button', { name: 'Ouvrir le détail' })).toHaveFocus();
  });

  it('annule le profil à la fermeture par historique et revalide à la réouverture', async () => {
    window.history.replaceState(null, '', `/users?trainee=${target.id}`);
    api.profile.mockReturnValueOnce(deferred<{ data: User }>().promise);
    mount(<DrawerHarness />);
    expect(screen.getByRole('dialog')).toBeVisible();
    const signal = api.profile.mock.calls[0][2];
    act(() => {
      window.history.replaceState(null, '', '/users');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(signal?.aborted).toBe(true);
    act(() => {
      window.history.replaceState(null, '', `/users?trainee=${target.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await screen.findByRole('heading', { name: target.full_name });
    expect(api.profile).toHaveBeenCalledTimes(2);
  });
});

describe('Validation et indépendance des ressources', () => {
  it.each([
    [404, 'Stagiaire introuvable'],
    [403, 'Vous n’avez pas accès à ce profil.'],
    [500, 'Impossible de charger le profil.'],
  ] as const)('bloque les inscriptions lorsque le profil répond %s', async (status, message) => {
    api.profile.mockRejectedValue(Object.assign(new Error('Erreur profil'), { status }));
    mount();
    expect(await screen.findByText(message)).toBeVisible();
    expect(api.enrollments).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Formations' })).not.toBeInTheDocument();
    expect(api.profile).toHaveBeenCalledTimes(status === 500 ? 2 : 1);
    if (status === 500) {
      api.profile.mockResolvedValue({ data: target });
      await userEvent.click(screen.getByRole('button', { name: 'Réessayer le profil' }));
      expect(await screen.findByText('Aucune inscription.')).toBeVisible();
    } else {
      expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument();
    }
  });

  it.each([Role.EDITOR, Role.SUPER_ADMIN, Role.CLIENT_MANAGER])(
    'refuse le profil non stagiaire %s',
    async (role) => {
      api.profile.mockResolvedValue({ data: { ...target, role } });
      mount();
      expect(await screen.findByRole('heading', { name: 'Stagiaire introuvable' })).toBeVisible();
      expect(api.enrollments).not.toHaveBeenCalled();
    },
  );

  it.each([null, undefined])(
    'ne charge pas les inscriptions pour un profil absent (%s)',
    async (data) => {
      // Réponse réseau incomplète, volontairement hors contrat TypeScript.
      api.profile.mockResolvedValue({ data } as unknown as { data: User });
      mount();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Impossible de charger le profil.',
      );
      expect(api.enrollments).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('button', { name: 'Modifier le stagiaire' }),
      ).not.toBeInTheDocument();
    },
  );

  it('ne considère pas un rôle absent comme un profil stagiaire validé', async () => {
    const withoutRole: Partial<User> = { ...target };
    delete withoutRole.role;
    api.profile.mockResolvedValue({ data: withoutRole } as { data: User });
    mount();
    await waitFor(() =>
      expect(screen.queryByText('Chargement du profil…')).not.toBeInTheDocument(),
    );
    expect({
      enrollmentCalls: api.enrollments.mock.calls.length,
      canEdit: Boolean(screen.queryByRole('button', { name: 'Modifier le stagiaire' })),
    }).toEqual({ enrollmentCalls: 0, canEdit: false });
  });

  it.each([403, 404, 500])(
    'conserve le profil lorsque les inscriptions répondent %s',
    async (status) => {
      api.enrollments.mockRejectedValue(
        Object.assign(new Error('Erreur inscriptions'), { status }),
      );
      mount();
      expect(await screen.findByRole('heading', { name: target.full_name })).toBeVisible();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        status === 404
          ? 'Les inscriptions de ce stagiaire ne sont plus accessibles.'
          : 'Impossible de charger les inscriptions.',
      );
      expect(screen.getByRole('button', { name: 'Modifier le stagiaire' })).toBeEnabled();
      expect(screen.queryByText('Aucune inscription.')).not.toBeInTheDocument();
      if (status === 500) {
        api.enrollments.mockResolvedValue(response([enrollment]));
        await userEvent.click(screen.getByRole('button', { name: 'Réessayer les inscriptions' }));
        expect(await screen.findByRole('article', { name: 'Formation initiale' })).toBeVisible();
        expect(api.profile).toHaveBeenCalledTimes(1);
      } else {
        expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument();
      }
    },
  );

  it('affiche les valeurs de remplacement des champs de profil nulls ou absents sans inventer de dates', async () => {
    api.profile.mockResolvedValue({
      data: {
        id: target.id,
        role: Role.TRAINEE,
        profile_photo: null,
        address: null,
        updated_at: null,
      } as User,
    });
    mount();
    await screen.findByRole('heading', { name: 'Stagiaire indisponible' });
    const profile = screen.getByRole('region', { name: 'Profil du stagiaire' });
    expect(within(profile).getByText('E-mail indisponible')).toBeVisible();
    expect(within(profile).getByText('Localisation non renseignée')).toBeVisible();
    expect(within(profile).getAllByText('Non renseignée')).toHaveLength(3);
    expect(within(profile).getByText('Non renseigné')).toBeVisible();
    expect(within(profile).getAllByText('—')).toHaveLength(2);
    expect(profile.querySelector('time')).toBeNull();
  });
});

describe('Inscriptions, filtres et pagination', () => {
  it.each([
    ['in_progress', 'En cours', 'bg-sky-50', 'text-sky-700'],
    ['completed', 'Terminées', 'bg-emerald-50', 'text-emerald-700'],
    ['not_started', 'Non commencées', 'bg-slate-50', 'text-slate-700'],
    ['failed', 'Échouées', 'bg-red-50', 'text-red-700'],
    ['expired', 'Expirées', 'bg-orange-50', 'text-orange-700'],
  ] as const)(
    'conserve les couleurs du statut %s dans le filtre actif et inactif',
    async (status, label, background, color) => {
      mount();
      await screen.findByText('Aucune inscription.');
      const group = screen.getByRole('group', { name: 'Filtrer les formations par statut' });
      const filter = within(group).getByRole('button', { name: label });
      expect(filter).toHaveClass('rounded-sm', background, color, 'aria-pressed:ring-current');
      expect(filter).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(filter);
      expect(filter).toHaveAttribute('aria-pressed', 'true');
      expect(filter).toHaveClass(background, color);
      expect(api.enrollments).toHaveBeenLastCalledWith(
        'portal',
        target.id,
        { ...defaults, status },
        expect.any(AbortSignal),
      );
      const all = within(group).getByRole('button', { name: 'Toutes' });
      await userEvent.click(all);
      expect(all).toHaveAttribute('aria-pressed', 'true');
      expect(all).toHaveClass('aria-pressed:bg-(--color-primary)/10');
      expect(filter).toHaveAttribute('aria-pressed', 'false');
    },
  );

  it('distingue deux inscriptions à la même formation', async () => {
    api.enrollments.mockResolvedValue(
      response([
        enrollment,
        {
          ...enrollment,
          id: 'inscription-2',
          status: 'completed',
          progress_percent: 83,
          completed_modules: 5,
          total_modules: 5,
          time_spent_seconds: 59,
        },
      ]),
    );
    mount();
    const list = await screen.findByRole('list', { name: 'Formations du stagiaire' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(list).getAllByRole('article', { name: 'Formation initiale' })).toHaveLength(2);
    expect(within(rows[0]).getByText('37%')).toBeVisible();
    expect(within(rows[0]).getByText('2 / 6')).toBeVisible();
    expect(within(rows[0]).getByText('1 h 1 min 1 s')).toBeVisible();
    expect(within(rows[1]).getByText('83%')).toBeVisible();
    expect(within(rows[1]).getByText('5 / 5')).toBeVisible();
    expect(within(rows[1]).getByText('59 s')).toBeVisible();
    expect(within(rows[1]).getByText('Terminée')).toBeVisible();
    expect(screen.getByText('2 inscriptions · Page 1 sur 1')).toBeVisible();
  });

  it('distingue une liste vide d’un filtre sans résultat et réinitialise le statut', async () => {
    mount();
    expect(await screen.findByText('Aucune inscription.')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Réinitialiser les filtres' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Terminées' }));
    expect(await screen.findByText('Aucune formation ne correspond aux filtres.')).toBeVisible();
    expect(api.enrollments).toHaveBeenLastCalledWith(
      'portal',
      target.id,
      { ...defaults, status: 'completed' },
      expect.any(AbortSignal),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(await screen.findByText('Aucune inscription.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Toutes' })).toHaveAttribute('aria-pressed', 'true');
    expect(api.enrollments).toHaveBeenLastCalledWith(
      'portal',
      target.id,
      defaults,
      expect.any(AbortSignal),
    );
  });

  it.each([
    ['statut', { status: 'completed' }],
    ['tri', { sort_by: 'title', sort_dir: 'asc' }],
  ] as const)(
    'revient à la première page avant le nouveau %s sans garder les anciennes lignes',
    async (kind, changed) => {
      api.enrollments.mockImplementation(async (_area, _id, params) =>
        response([enrollment], params.page, 45),
      );
      mount();
      await screen.findByRole('article');
      await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
      await screen.findByText('45 inscriptions · Page 2 sur 3');
      const pending = deferred<TraineeEnrollmentsResponse>();
      api.enrollments.mockReturnValue(pending.promise).mockClear();
      if (kind === 'statut') {
        await userEvent.click(screen.getByRole('button', { name: 'Terminées' }));
      } else {
        await userEvent.click(screen.getByRole('combobox', { name: 'Trier par' }));
        await userEvent.click(screen.getByRole('option', { name: 'Nom de formation' }));
      }
      expect(api.enrollments).toHaveBeenCalledTimes(1);
      expect(api.enrollments).toHaveBeenCalledWith(
        'portal',
        target.id,
        { ...defaults, ...changed },
        expect.any(AbortSignal),
      );
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Chargement des inscriptions');
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
      await act(async () => pending.resolve(response()));
      await screen.findByText(
        kind === 'statut' ? 'Aucune formation ne correspond aux filtres.' : 'Aucune inscription.',
      );
    },
  );

  it('ne montre pas la page précédente pendant le chargement et permet de revenir', async () => {
    api.enrollments.mockResolvedValue(response([enrollment], 1, 21));
    const pending = deferred<TraineeEnrollmentsResponse>();
    const view = mount();
    await screen.findByRole('article');
    api.enrollments.mockReturnValueOnce(pending.promise);
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(api.enrollments).toHaveBeenLastCalledWith(
      'portal',
      target.id,
      { ...defaults, page: 2 },
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await act(async () => pending.resolve(response([], 2, 21)));
    expect(await screen.findByText('Aucune inscription sur cette page.')).toBeVisible();
    expect(screen.getByText('21 inscriptions · Page 2 sur 2')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Précédent' }));
    expect(await screen.findByRole('article')).toBeVisible();
    expect(api.profile).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('temporise la recherche à 300 ms, masque les lignes et réinitialise page, recherche, statut et tri', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    api.enrollments.mockImplementation(async (_area, _id, params) =>
      response(params.q ? [] : [enrollment], params.page, params.q ? 0 : 45),
    );
    mount();
    await screen.findByRole('article');
    await user.click(screen.getByRole('button', { name: 'Terminées' }));
    await screen.findByRole('article');
    await user.click(screen.getByRole('combobox', { name: 'Trier par' }));
    await user.click(screen.getByRole('option', { name: 'Nom de formation' }));
    await screen.findByRole('article');
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    await screen.findByText('45 inscriptions · Page 2 sur 3');
    api.enrollments.mockClear();
    await user.type(
      screen.getByRole('searchbox', { name: 'Rechercher une formation' }),
      '  sécurité  ',
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await act(async () => jest.advanceTimersByTimeAsync(299));
    expect(api.enrollments.mock.calls.every(([, , params]) => params.q === '')).toBe(true);
    await act(async () => jest.advanceTimersByTimeAsync(1));
    expect(await screen.findByText('Aucune formation ne correspond aux filtres.')).toBeVisible();
    const searched = api.enrollments.mock.calls.filter(([, , params]) => params.q === 'sécurité');
    expect(searched).toHaveLength(1);
    expect(searched[0][2]).toEqual({
      ...defaults,
      q: 'sécurité',
      status: 'completed',
      sort_by: 'title',
      sort_dir: 'asc',
    });
    expect(api.enrollments.mock.calls.every(([, , params]) => params.page === 1)).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Trier par' })).toHaveTextContent(
      'Inscription la plus récente',
    );
    expect(screen.getByRole('button', { name: 'Toutes' })).toHaveAttribute('aria-pressed', 'true');
    await act(async () => jest.advanceTimersByTimeAsync(300));
    expect(await screen.findByRole('article')).toBeVisible();
    expect(api.enrollments).toHaveBeenLastCalledWith(
      'portal',
      target.id,
      defaults,
      expect.any(AbortSignal),
    );
  });
});

describe('Isolation du contexte et édition', () => {
  it.each(['compte', 'session', 'tenant', 'rôle', 'cible', 'espace'])(
    'masque les données précédentes au changement de %s',
    async (change) => {
      api.enrollments.mockResolvedValue(response([enrollment]));
      const view = mount();
      await screen.findByRole('article');
      await userEvent.click(screen.getByRole('button', { name: 'Modifier le stagiaire' }));
      const pending = deferred<{ data: User }>();
      api.profile.mockReturnValue(pending.promise).mockClear();
      api.enrollments.mockClear();
      act(() => {
        if (change === 'compte')
          useAuthStore.getState().setAuth({ ...actor, id: 'gestionnaire-2' }, 'session-1');
        if (change === 'session') useAuthStore.getState().setAuth(actor, 'session-2');
        if (change === 'tenant') useTenantStore.getState().setTenant({ ...tenant, id: 'tenant-2' });
        if (change === 'rôle') useAuthStore.getState().setAuth({ ...actor, role: Role.EDITOR });
      });
      const id = change === 'cible' ? 'stagiaire-2' : target.id;
      const area = change === 'espace' ? 'admin' : 'portal';
      view.rerender(<TraineeDetailPage id={id} area={area} onEdit={onEdit} />);
      expect(screen.queryByRole('heading', { name: target.full_name })).not.toBeInTheDocument();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(api.enrollments).not.toHaveBeenCalled();
      expect(api.profile).toHaveBeenCalledWith(area, id, expect.any(AbortSignal));
      await act(async () =>
        pending.resolve({ data: { ...target, id, full_name: 'Profil revalidé' } }),
      );
      expect(await screen.findByRole('heading', { name: 'Profil revalidé' })).toBeVisible();
      await waitFor(() =>
        expect(api.enrollments).toHaveBeenCalledWith(area, id, defaults, expect.any(AbortSignal)),
      );
    },
  );

  it('revalide un ancien profil en cache avant de le réafficher ou de relancer ses inscriptions', async () => {
    api.enrollments.mockResolvedValue(response([enrollment]));
    const view = mount();
    await screen.findByRole('article');
    api.profile.mockResolvedValue({
      data: { ...target, id: 'stagiaire-2', full_name: 'Bob Martin' },
    });
    view.rerender(<TraineeDetailPage id="stagiaire-2" area="portal" onEdit={onEdit} />);
    await screen.findByRole('heading', { name: 'Bob Martin' });
    await screen.findByRole('article');
    api.profile.mockReturnValue(deferred<{ data: User }>().promise);
    api.enrollments.mockClear();
    view.rerender(<TraineeDetailPage id={target.id} area="portal" onEdit={onEdit} />);
    expect({
      cachedProfileVisible: Boolean(screen.queryByRole('heading', { name: target.full_name })),
      cachedRowsVisible: Boolean(screen.queryByRole('article')),
      enrollmentCalls: api.enrollments.mock.calls.length,
    }).toEqual({ cachedProfileVisible: false, cachedRowsVisible: false, enrollmentCalls: 0 });
  });

  it.each(['profil', 'inscriptions'])(
    'annule la requête de %s et ignore sa réponse tardive après changement de cible',
    async (resource) => {
      const profilePending = deferred<{ data: User }>();
      const enrollmentsPending = deferred<TraineeEnrollmentsResponse>();
      if (resource === 'profil') api.profile.mockReturnValueOnce(profilePending.promise);
      else api.enrollments.mockReturnValueOnce(enrollmentsPending.promise);
      const view = mount();
      if (resource === 'inscriptions')
        await waitFor(() => expect(api.enrollments).toHaveBeenCalledTimes(1));
      const signal =
        resource === 'profil' ? api.profile.mock.calls[0][2] : api.enrollments.mock.calls[0][3];
      api.profile.mockResolvedValue({
        data: { ...target, id: 'stagiaire-2', full_name: 'Bob Martin' },
      });
      api.enrollments.mockResolvedValue(response());
      view.rerender(<TraineeDetailPage id="stagiaire-2" area="portal" onEdit={onEdit} />);
      expect(signal?.aborted).toBe(true);
      await screen.findByRole('heading', { name: 'Bob Martin' });
      await act(async () => {
        profilePending.resolve({ data: target });
        enrollmentsPending.resolve(response([enrollment]));
      });
      expect(screen.queryByRole('heading', { name: target.full_name })).not.toBeInTheDocument();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    },
  );

  it.each(['déconnecté', 'stagiaire'])('n’effectue aucun appel pour un visiteur %s', (state) => {
    if (state === 'déconnecté') useAuthStore.getState().clearAuth();
    else useAuthStore.getState().setAuth({ ...actor, role: Role.TRAINEE });
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Vous n’avez pas accès à cette page.');
    expect(api.profile).not.toHaveBeenCalled();
    expect(api.enrollments).not.toHaveBeenCalled();
  });

  it.each(['déconnexion', 'rôle non autorisé'])(
    'retire profil, inscriptions et drawer après %s sans nouvel appel',
    async (change) => {
      api.enrollments.mockResolvedValue(response([enrollment]));
      mount();
      await screen.findByRole('article');
      await userEvent.click(screen.getByRole('button', { name: 'Modifier le stagiaire' }));
      api.profile.mockClear();
      api.enrollments.mockClear();
      act(() => {
        if (change === 'déconnexion') useAuthStore.getState().clearAuth();
        else useAuthStore.getState().setAuth({ ...actor, role: Role.TRAINEE });
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Vous n’avez pas accès à cette page.');
      expect(screen.queryByRole('heading', { name: target.full_name })).not.toBeInTheDocument();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(api.profile).not.toHaveBeenCalled();
      expect(api.enrollments).not.toHaveBeenCalled();
    },
  );

  it.each(areas)(
    'remplace le détail par le formulaire %s puis revient à la liste après fermeture ou sauvegarde',
    async (area) => {
      const path = area === 'admin' ? '/admin/users' : '/users';
      window.history.replaceState(null, '', `${path}?q=Alice&page=3`);
      api.enrollments.mockResolvedValue(response([enrollment]));
      const user = userEvent.setup();
      mount(<DrawerHarness area={area} />);
      const trigger = screen.getByRole('button', { name: 'Ouvrir le détail' });
      await user.click(trigger);
      await screen.findByRole('article');
      await user.click(screen.getByRole('heading', { name: target.full_name }));
      await user.click(screen.getByRole('article'));
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      const edit = screen.getByRole('button', { name: 'Modifier le stagiaire' });
      await user.click(edit);
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Détail du stagiaire' }),
        ).not.toBeInTheDocument(),
      );
      expect(window.location.pathname + window.location.search).toBe(`${path}?q=Alice&page=3`);
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
      const form = screen.getByRole('form', { name: `Formulaire de test ${area}` });
      expect(within(form).getByRole('textbox', { name: 'Nom du stagiaire' })).toHaveValue(
        target.full_name,
      );
      await user.click(within(form).getByRole('button', { name: 'Fermer' }));
      expect(api.profile).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await user.click(trigger);
      await screen.findByRole('article');
      await user.click(screen.getByRole('button', { name: 'Modifier le stagiaire' }));
      api.profile.mockResolvedValue({ data: { ...target, full_name: 'Alice Modifiée' } });
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(api.profile).toHaveBeenCalledTimes(2);
      await user.click(trigger);
      expect(await screen.findByRole('heading', { name: 'Alice Modifiée' })).toBeVisible();
      expect(api.profile).toHaveBeenCalledTimes(3);
      expect(api.profile).toHaveBeenLastCalledWith(area, target.id, expect.any(AbortSignal));
    },
  );

  it.each(['déconnexion', 'tenant', 'session'])(
    'retire le formulaire transféré après changement de %s',
    async (change) => {
      window.history.replaceState(null, '', `/users?trainee=${target.id}`);
      mount(<DrawerHarness />);
      await userEvent.click(await screen.findByRole('button', { name: 'Modifier le stagiaire' }));
      expect(screen.getByRole('form')).toBeVisible();
      act(() => {
        if (change === 'déconnexion') useAuthStore.getState().clearAuth();
        if (change === 'tenant') useTenantStore.getState().setTenant({ ...tenant, id: 'tenant-2' });
        if (change === 'session') useAuthStore.getState().setAuth(actor, 'session-2');
      });
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );

  it('remplace l’édition par un détail restauré depuis l’historique sans rouvrir le formulaire', async () => {
    window.history.replaceState(null, '', `/users?trainee=${target.id}`);
    mount(<DrawerHarness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Modifier le stagiaire' }));
    expect(screen.getByRole('form')).toBeVisible();
    act(() => {
      window.history.replaceState(null, '', `/users?trainee=${target.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await screen.findByRole('heading', { name: target.full_name });
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer le détail du stagiaire' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });
});
