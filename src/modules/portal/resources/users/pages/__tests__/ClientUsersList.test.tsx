jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../api', () => ({ clientUsersApi: { list: jest.fn() } }));
jest.mock('../../components/UserFormDrawer', () => ({
  UserFormDrawer: ({ open, user }: { open: boolean; user?: { full_name: string } }) =>
    open ? <div role="dialog">Modifier {user?.full_name}</div> : null,
}));

jest.mock('@/modules/shared/components/trainees/TraineeDetailDrawer', () => ({
  TraineeDetailDrawer: ({ id, area, onClose }: ComponentProps<typeof TraineeDetailDrawer>) =>
    id ? (
      <div role="dialog" aria-label="Détail du stagiaire">
        Stagiaire {id} ({area})<button onClick={onClose}>Fermer le détail du stagiaire</button>
      </div>
    ) : null,
}));

jest.mock('@/modules/shared/components/client-managers/ClientManagerDetailDrawer', () => ({
  ClientManagerDetailDrawer: ({ id, area, onClose }: ComponentProps<typeof TraineeDetailDrawer>) =>
    id ? (
      <div role="dialog" aria-label="Détail du responsable">
        Responsable {id} ({area})<button onClick={onClose}>Fermer le détail du responsable</button>
      </div>
    ) : null,
}));

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type { TraineeDetailDrawer } from '@/modules/shared/components/trainees/TraineeDetailDrawer';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import { Role } from '@/shared/constants/roles';
import { clientUsersApi } from '../../api';
import { normalizeClientUser } from '../../types';
import { ClientUserList } from '../ClientUsersList';

const mockPush = jest.fn();
const trainee = normalizeClientUser({
  id: 'trainee-1',
  first_name: 'Alice',
  last_name: 'Dupont',
  email: 'alice@example.test',
  role: Role.TRAINEE,
});
const manager = normalizeClientUser({
  id: 'manager-1',
  first_name: 'Bob',
  last_name: 'Martin',
  email: 'bob@example.test',
  role: Role.CLIENT_MANAGER,
});

describe('ClientUserList — détail du stagiaire et état de la liste', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, '', '/users');
    jest.mocked(clientUsersApi.list).mockResolvedValue({ data: [trainee, manager], total: 200 });
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    jest.useRealTimers();
  });

  it.each(['Alice', ''])(
    'restaure la recherche « %s » après retour navigateur sans réactiver le brouillon',
    async (initialSearch) => {
      jest.useFakeTimers();
      const interaction = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const bob = normalizeClientUser({ ...manager, role: Role.TRAINEE });
      const initialParams = new URLSearchParams({
        ...(initialSearch ? { q: initialSearch } : {}),
        roles: Role.TRAINEE,
        is_active: 'true',
        page: '3',
        page_size: '50',
        sort_by: 'email',
        sort_dir: 'asc',
      });
      window.history.replaceState(null, '', `/users?${initialParams}`);
      const initialUrl = window.location.href;
      window.history.pushState(null, '', initialUrl);
      const list = jest.mocked(clientUsersApi.list);
      list.mockImplementation(async (params) => ({
        data: [params?.q === 'Bob' ? bob : trainee],
        total: 200,
      }));
      renderWithQueryClient(<ClientUserList />);
      await screen.findByRole('button', { name: 'Ouvrir Alice Dupont' });

      const search = screen.getByRole('textbox', { name: 'Rechercher' });
      await interaction.clear(search);
      await interaction.type(search, 'Bob');
      await act(async () => jest.advanceTimersByTimeAsync(400));
      await screen.findByText('bob@example.test');
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Bob', page: 0 }));
      list.mockClear();

      await act(async () => {
        window.history.back();
        await jest.advanceTimersByTimeAsync(10);
      });
      expect(search).toHaveValue(initialSearch);
      await screen.findByText('alice@example.test');
      expect(screen.queryByText('bob@example.test')).not.toBeInTheDocument();
      await act(async () => jest.advanceTimersByTimeAsync(500));
      expect(window.location.href).toBe(initialUrl);
      expect(search).toHaveValue(initialSearch);
      expect(screen.getByText('101–150 sur 200')).toBeInTheDocument();
      expect(list).toHaveBeenCalledTimes(1);
      expect(list.mock.calls[0][0]?.q).toBe(initialSearch || undefined);
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          roles: Role.TRAINEE,
          is_active: true,
          page: 2,
          page_size: 50,
          sort_by: 'email',
          sort_dir: 'asc',
        }),
      );

      await act(async () => {
        window.history.forward();
        await jest.advanceTimersByTimeAsync(10);
      });
      await screen.findByText('bob@example.test');
      expect(search).toHaveValue('Bob');
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Bob', page: 0 }));
    },
  );

  it.each(['ligne', 'Voir'])(
    'ouvre le détail du stagiaire depuis %s sans quitter la liste ni perdre ses filtres',
    async (action) => {
      window.history.replaceState(
        null,
        '',
        '/users?q=Alice&roles=TRAINEE&is_active=true&page=3&page_size=50&sort_by=name&sort_dir=asc&view=compact',
      );
      const listUrl = new URL(window.location.href);
      const interaction = userEvent.setup();
      renderWithQueryClient(<ClientUserList />);
      await screen.findByText('alice@example.test');
      if (action === 'ligne') {
        await interaction.click(screen.getByText('alice@example.test'));
      } else {
        await interaction.click(screen.getByRole('button', { name: 'Actions pour Alice Dupont' }));
        await interaction.click(screen.getByRole('menuitem', { name: 'Voir le détail' }));
      }
      expect(screen.getByRole('dialog')).toHaveTextContent('Stagiaire trainee-1 (portal)');
      expect(window.location.pathname).toBe('/users');
      expect(Object.fromEntries(new URLSearchParams(window.location.search))).toEqual({
        ...Object.fromEntries(listUrl.searchParams),
        trainee: trainee.id,
      });
      expect(screen.getByText('alice@example.test')).toBeInTheDocument();
      expect(screen.getByText('101–150 sur 200')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();

      await interaction.click(
        screen.getByRole('button', { name: 'Fermer le détail du stagiaire' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.href).toBe(listUrl.href);
      expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('Alice');
      expect(screen.getByText('alice@example.test')).toBeInTheDocument();
      expect(screen.getByText('101–150 sur 200')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('50');
      expect(screen.getByRole('button', { name: '1 rôle' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Actif' })).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it.each(['ligne', 'Voir'])('ouvre le détail du responsable depuis %s', async (action) => {
    window.history.replaceState(null, '', '/users?q=Bob&page=3#resultats');
    const initialUrl = window.location.href;
    const interaction = userEvent.setup();
    renderWithQueryClient(<ClientUserList />);
    await screen.findByText('bob@example.test');
    if (action === 'ligne') await interaction.click(screen.getByText('bob@example.test'));
    else {
      await interaction.click(screen.getByRole('button', { name: 'Actions pour Bob Martin' }));
      await interaction.click(screen.getByRole('menuitem', { name: 'Voir le détail' }));
    }
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('Responsable manager-1 (portal)');
    expect(window.location.search).toBe('?q=Bob&page=3&manager=manager-1');
    expect(window.location.hash).toBe('#resultats');
    expect(mockPush).not.toHaveBeenCalled();
    expect(new URLSearchParams(window.location.search).has('trainee')).toBe(false);
    await interaction.click(
      screen.getByRole('button', { name: 'Fermer le détail du responsable' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.href).toBe(initialUrl);
  });

  it.each(['Alice Dupont', 'Bob Martin'])(
    'Modifier ne déclenche pas le détail de %s',
    async (name) => {
      const interaction = userEvent.setup();
      renderWithQueryClient(<ClientUserList />);
      await interaction.click(await screen.findByRole('button', { name: `Actions pour ${name}` }));
      await interaction.click(screen.getByRole('menuitem', { name: 'Modifier' }));
      expect(screen.getByRole('dialog')).toHaveTextContent(`Modifier ${name}`);
      expect(mockPush).not.toHaveBeenCalled();
      expect(new URLSearchParams(window.location.search).has('trainee')).toBe(false);
      expect(new URLSearchParams(window.location.search).has('manager')).toBe(false);
    },
  );

  it('conserve les paramètres à la fermeture du détail et les restaure au remontage', async () => {
    const interaction = userEvent.setup();
    const first = renderWithQueryClient(<ClientUserList />);
    await screen.findByText('alice@example.test');
    await interaction.type(screen.getByRole('textbox', { name: 'Rechercher' }), 'Alice{Enter}');
    await interaction.click(screen.getByRole('columnheader', { name: 'Email' }));
    await interaction.selectOptions(screen.getByRole('combobox'), '50');
    await interaction.click(screen.getByRole('link', { name: 'Go to next page' }));
    const listUrl = new URL(window.location.href);
    await interaction.click(screen.getByText('alice@example.test'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Stagiaire trainee-1 (portal)');
    expect(window.location.pathname).toBe('/users');
    expect(Object.fromEntries(new URLSearchParams(window.location.search))).toEqual({
      ...Object.fromEntries(listUrl.searchParams),
      trainee: trainee.id,
    });
    await interaction.click(screen.getByRole('button', { name: 'Fermer le détail du stagiaire' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.href).toBe(listUrl.href);
    expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('Alice');
    expect(screen.getByText('51–100 sur 200')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    first.unmount();
    renderWithQueryClient(<ClientUserList />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('Alice');
    await waitFor(() =>
      expect(clientUsersApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: 'Alice',
          page: 1,
          page_size: 50,
          sort_by: 'email',
          sort_dir: 'asc',
        }),
      ),
    );
    expect(await screen.findByText('51–100 sur 200')).toBeInTheDocument();
  });
});
