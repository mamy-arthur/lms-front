/**
 * Tests fonctionnels — ModuleList
 *
 * On teste la gestion d'état de la page (ouverture du drawer, dialogs de
 * suppression et duplication, props transmises à la table) en mockant les hooks
 * React Query et les composants enfants complexes.
 */

// ─── Polyfills ────────────────────────────────────────────────────────────────
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

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('@/modules/admin/resources/modules/hooks/useModules', () => ({
  useModules: jest.fn(),
  ADMIN_MODULES_QUERY_KEY: ['admin', 'modules'],
}));

jest.mock('@/modules/admin/resources/modules/hooks/useDeleteModule', () => ({
  useDeleteModule: () => ({ mutate: mockDelete, isPending: false }),
}));

jest.mock('@/modules/admin/resources/modules/hooks/useDuplicateModule', () => ({
  useDuplicateModule: () => ({ mutate: mockDuplicate, isPending: false }),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueriesData: jest.fn(), invalidateQueries: jest.fn() }),
}));

jest.mock('@modules/shared/hooks/useModuleListController', () => ({
  useModuleListController: () => ({
    params: {},
    page: 0,
    pageSize: 25,
    sort: undefined,
    hasQuery: false,
    draftCategory: ['all'],
    isDrawerOpen: false,
    editingModule: undefined,
    handleEdit: mockHandleEdit,
    handleOpenCreate: mockHandleOpenCreate,
    handleCloseDrawer: jest.fn(),
    handleSuccess: jest.fn(),
    handleSort: jest.fn(),
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    handleSearch: jest.fn(),
    setDraftCategory: jest.fn(),
  }),
}));

jest.mock('@modules/shared/components/modules', () => ({
  ModuleSearch: () => <div data-testid="module-search" />,
}));

const mockTableProps = jest.fn();
jest.mock('@/modules/admin/resources/modules/pages/_components/admin-modules-table', () => ({
  AdminModulesTable: (props: object) => {
    mockTableProps(props);
    return <div data-testid="admin-modules-table" />;
  },
}));

const mockDrawerProps = jest.fn();
jest.mock('@/modules/admin/resources/modules/pages/_components/AdminModuleFormDrawer', () => ({
  AdminModuleFormDrawer: (props: object) => {
    mockDrawerProps(props);
    return null;
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useModules } from '@/modules/admin/resources/modules/hooks/useModules';
import { ModuleList } from '../ModuleList';
import type { Module } from '../../types';

const mockUseModules = jest.mocked(useModules);
const mockDelete = jest.fn();
const mockDuplicate = jest.fn();
const mockHandleEdit = jest.fn();
const mockHandleOpenCreate = jest.fn();

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOD_1: Module = {
  id: 'mod-001',
  shortname: 'Développement Web',
  idnumber: 'DW-001',
  description: '',
  category_id: 'formation',
  category_name: null,
  tenantId: '1',
  courseIds: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const MOD_2: Module = {
  id: 'mod-002',
  shortname: 'Sécurité Réseau',
  idnumber: 'SEC-002',
  description: '',
  category_id: 'specialisation',
  category_name: null,
  tenantId: '1',
  courseIds: [],
  createdAt: '2025-02-01T00:00:00Z',
  updatedAt: '2025-02-01T00:00:00Z',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ModuleList />
    </QueryClientProvider>,
  );
}

function lastTableProps() {
  const calls = mockTableProps.mock.calls;
  return calls[calls.length - 1]?.[0] as {
    modules: Module[];
    isLoading: boolean;
    onEdit: (m: Module) => void;
    onDuplicate: (m: Module) => void;
    onDelete: (m: Module) => void;
  };
}

function lastDrawerProps() {
  const calls = mockDrawerProps.mock.calls;
  return calls[calls.length - 1]?.[0] as {
    open: boolean;
    module: Module | undefined;
    onClose: () => void;
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ModuleList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseModules.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
    } as unknown as ReturnType<typeof useModules>);
  });

  // ── Rendu initial ──────────────────────────────────────────────────────────

  it('affiche le titre de la page', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /modules/i })).toBeInTheDocument();
  });

  it('affiche le bouton de création', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /nouveau module/i })).toBeInTheDocument();
  });

  it('transmet isLoading=true à la table pendant le chargement', () => {
    mockUseModules.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useModules>);

    renderPage();

    expect(lastTableProps().isLoading).toBe(true);
  });

  it('transmet la liste des modules à la table', () => {
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1, MOD_2], total: 2 },
      isLoading: false,
    } as ReturnType<typeof useModules>);

    renderPage();

    expect(lastTableProps().modules).toEqual([MOD_1, MOD_2]);
  });

  it('transmet une liste vide quand data est undefined', () => {
    mockUseModules.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useModules>);

    renderPage();

    expect(lastTableProps().modules).toEqual([]);
  });

  // ── Drawer ─────────────────────────────────────────────────────────────────

  it('le drawer est fermé par défaut', () => {
    renderPage();
    expect(lastDrawerProps().open).toBe(false);
    expect(lastDrawerProps().module).toBeUndefined();
  });

  it('ouvre le drawer en mode création au clic sur "Nouveau module"', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /nouveau module/i }));

    expect(mockHandleOpenCreate).toHaveBeenCalled();
  });

  it('ouvre le drawer en mode édition via onEdit', () => {
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onEdit(MOD_1);
    });

    expect(mockHandleEdit).toHaveBeenCalledWith(MOD_1);
  });

  // ── Dialog de suppression ──────────────────────────────────────────────────

  it('ouvre le dialog de suppression via onDelete', () => {
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onDelete(MOD_1);
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /supprimer le module/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(MOD_1.shortname))).toBeInTheDocument();
  });

  it('appelle deleteMutation au clic sur "Supprimer"', async () => {
    const user = userEvent.setup();
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onDelete(MOD_1);
    });

    await user.click(screen.getByRole('button', { name: /^supprimer$/i }));

    expect(mockDelete).toHaveBeenCalledWith({ id: MOD_1.id, idnumber: MOD_1.idnumber });
  });

  it('ferme le dialog de suppression au clic sur "Annuler"', async () => {
    const user = userEvent.setup();
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onDelete(MOD_1);
    });
    await user.click(screen.getByRole('button', { name: /annuler/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  // ── Dialog de duplication ──────────────────────────────────────────────────

  it('ouvre le dialog de duplication via onDuplicate', () => {
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onDuplicate(MOD_1);
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/dupliquer le module/i)).toBeInTheDocument();
  });

  it('appelle duplicateMutation sans shortname quand le champ est vide', async () => {
    const user = userEvent.setup();
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onDuplicate(MOD_1);
    });
    await user.click(screen.getByRole('button', { name: /dupliquer/i }));

    expect(mockDuplicate).toHaveBeenCalledWith({ id: MOD_1.id, shortname: undefined });
  });

  it('appelle duplicateMutation avec le shortname personnalisé', async () => {
    const user = userEvent.setup();
    mockUseModules.mockReturnValue({
      data: { data: [MOD_1], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useModules>);
    renderPage();

    act(() => {
      lastTableProps().onDuplicate(MOD_1);
    });

    const input = screen.getByRole('textbox');
    await user.type(input, 'Dev Web BIS');
    await user.click(screen.getByRole('button', { name: /dupliquer/i }));

    expect(mockDuplicate).toHaveBeenCalledWith({ id: MOD_1.id, shortname: 'Dev Web BIS' });
  });
});
