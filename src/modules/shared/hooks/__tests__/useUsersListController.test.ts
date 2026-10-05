/**
 * Tests unitaires — useUsersListController
 *
 * Couvre :
 *  - handleSearchOnly : n'applique que q (pas role/status/tenant), reset page à 0
 *  - handleSearch : applique q + role + status + tenant, reset page à 0
 *  - handleSearch vs handleSearchOnly : indépendance des filtres
 *  - handleSort : tri + inversion de direction
 *  - handlePageChange / handlePageSizeChange
 *  - hasQuery : calcul correct
 */

import { act, renderHook } from '@testing-library/react';
import { useUsersListController } from '../useUsersListController';

describe('useUsersListController', () => {
  // ── handleSearchOnly ──────────────────────────────────────────────────────

  describe('handleSearchOnly', () => {
    it("n'applique que le paramètre q dans les params", () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.setDraftSearch('alice'));
      act(() => result.current.handleSearchOnly());

      expect(result.current.params).toMatchObject({ q: 'alice' });
    });

    it('remet page à 0', () => {
      const { result } = renderHook(() => useUsersListController({ defaultPageSize: 10 }));

      act(() => result.current.handlePageChange(3));
      act(() => result.current.setDraftSearch('bob'));
      act(() => result.current.handleSearchOnly());

      expect(result.current.params).toMatchObject({ page: 0 });
    });

    it('ne modifie pas role, status ni tenant déjà appliqués par handleSearch', () => {
      const { result } = renderHook(() => useUsersListController({ includeTenantFilter: true }));

      // Applique d'abord des filtres complets
      act(() => result.current.setDraftSearch('alice'));
      act(() => result.current.setDraftRole('EDITOR'));
      act(() => result.current.setDraftStatus('active'));
      act(() => result.current.setDraftTenant('tenant-001'));
      act(() => result.current.handleSearch());

      const paramsAfterFullSearch = result.current.params;

      // Modifie uniquement la recherche textuelle
      act(() => result.current.setDraftSearch('bob'));
      act(() => result.current.handleSearchOnly());

      expect(result.current.params).toMatchObject({
        q: 'bob',
        // Les filtres appliqués par handleSearch précédent sont préservés dans params
        // (handleSearchOnly ne touche pas role/is_active/tenant_id déjà en place)
        roles: paramsAfterFullSearch.roles,
        is_active: paramsAfterFullSearch.is_active,
        tenant_id: paramsAfterFullSearch.tenant_id,
      });
    });

    it('met q à undefined si draftSearch est vide', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.setDraftSearch(''));
      act(() => result.current.handleSearchOnly());

      expect((result.current.params as Record<string, unknown>).q).toBeUndefined();
    });
  });

  // ── handleSearch ──────────────────────────────────────────────────────────

  describe('handleSearch', () => {
    it('applique q, role, is_active et reset page à 0', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.setDraftSearch('alice'));
      act(() => result.current.setDraftRole('EDITOR'));
      act(() => result.current.setDraftStatus('active'));
      act(() => result.current.handleSearch());

      expect(result.current.params).toMatchObject({
        q: 'alice',
        roles: 'EDITOR',
        is_active: true,
        page: 0,
      });
    });

    it("n'applique pas tenant_id si includeTenantFilter est false", () => {
      const { result } = renderHook(() => useUsersListController({ includeTenantFilter: false }));

      act(() => result.current.setDraftTenant('tenant-001'));
      act(() => result.current.handleSearch());

      expect((result.current.params as Record<string, unknown>).tenant_id).toBeUndefined();
    });

    it('applique tenant_id si includeTenantFilter est true', () => {
      const { result } = renderHook(() => useUsersListController({ includeTenantFilter: true }));

      act(() => result.current.setDraftTenant('tenant-001'));
      act(() => result.current.handleSearch());

      expect(result.current.params).toMatchObject({ tenant_id: 'tenant-001' });
    });

    it('met role à undefined si draftRole est "all"', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.setDraftRole('all'));
      act(() => result.current.handleSearch());

      expect((result.current.params as Record<string, unknown>).roles).toBeUndefined();
    });
  });

  // ── handleSort ────────────────────────────────────────────────────────────

  describe('handleSort', () => {
    it('applique la colonne de tri avec direction asc par défaut', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.handleSort('name'));

      expect(result.current.sort).toMatchObject({ column: 'name', direction: 'asc' });
    });

    it('inverse la direction sur un second tri de la même colonne', () => {
      const { result } = renderHook(() =>
        useUsersListController({ defaultSortBy: 'name', defaultSortDir: 'asc' }),
      );

      act(() => result.current.handleSort('name'));
      expect(result.current.sort.direction).toBe('desc');

      act(() => result.current.handleSort('name'));
      expect(result.current.sort.direction).toBe('asc');
    });
  });

  // ── hasQuery ──────────────────────────────────────────────────────────────

  describe('hasQuery', () => {
    it('retourne false par défaut (aucun filtre actif)', () => {
      const { result } = renderHook(() => useUsersListController());
      expect(result.current.hasQuery).toBe(false);
    });

    it("retourne true dès qu'une recherche textuelle est saisie", () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.setDraftSearch('alice'));
      expect(result.current.hasQuery).toBe(true);
    });

    it('retourne true si un rôle autre que "all" est sélectionné', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.setDraftRole('EDITOR'));
      expect(result.current.hasQuery).toBe(true);
    });
  });

  // ── pagination ────────────────────────────────────────────────────────────

  describe('pagination', () => {
    it('handlePageChange met à jour la page', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.handlePageChange(2));
      expect(result.current.page).toBe(2);
    });

    it('handlePageSizeChange met à jour page_size et remet page à 0', () => {
      const { result } = renderHook(() => useUsersListController());

      act(() => result.current.handlePageChange(3));
      act(() => result.current.handlePageSizeChange(50));

      expect(result.current.pageSize).toBe(50);
      expect(result.current.page).toBe(0);
    });
  });
});

describe('useUsersListController — état dans l’URL', () => {
  const options = { urlPath: '/admin/users', includeTenantFilter: true, includeClientFilter: true };

  beforeEach(() => window.history.replaceState(null, '', '/admin/users'));
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('restaure recherche, rôles, statut, périmètre, tri et pagination après démontage', () => {
    const first = renderHook(() => useUsersListController(options));
    act(() => first.result.current.setDraftSearch('Alice & Bob'));
    act(() => first.result.current.handleSearch());
    act(() => {
      first.result.current.handleRoleToggle('TRAINEE');
      first.result.current.handleRoleToggle('CLIENT_MANAGER');
      first.result.current.setDraftStatus('inactive');
      first.result.current.setDraftTenant('tenant-1');
      first.result.current.setParams((prev) => ({ ...prev, client_id: 'client-1' }));
      first.result.current.handleSort('email');
      first.result.current.handlePageSizeChange(50);
      first.result.current.handlePageChange(3);
    });
    const expected = first.result.current.params;
    const returnTo = first.result.current.returnTo;
    expect(window.location.pathname + window.location.search).toBe(returnTo);
    first.unmount();

    const restored = renderHook(() => useUsersListController(options));
    expect(restored.result.current.params).toEqual(expected);
    expect(restored.result.current.draftSearch).toBe('Alice & Bob');
    expect(restored.result.current.selectedRoles).toEqual(['TRAINEE', 'CLIENT_MANAGER']);
    expect(restored.result.current.draftStatus).toBe('inactive');
    expect(restored.result.current.draftTenant).toBe('tenant-1');
    expect(restored.result.current.page).toBe(3);
    expect(restored.result.current.pageSize).toBe(50);
    expect(restored.result.current.sort).toEqual({ column: 'email', direction: 'asc' });
    // Replaying the search debounce after hydration must not reset page 3.
    act(() => restored.result.current.handleSearch());
    expect(restored.result.current.page).toBe(3);
  });

  it('restaure aussi une entrée d’historique sans démonter le contrôleur', () => {
    const { result } = renderHook(() => useUsersListController(options));
    act(() => result.current.setDraftSearch('brouillon'));
    act(() => {
      window.history.replaceState(null, '', '/admin/users?q=retour&page=4&is_active=false');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.draftSearch).toBe('retour');
    expect(result.current.page).toBe(3);
    expect(result.current.draftStatus).toBe('inactive');
  });

  it('n’écrit dans l’URL que les valeurs non par défaut, avec une pagination à base 1', () => {
    const { result } = renderHook(() => useUsersListController(options));
    act(() => result.current.handlePageChange(2));
    expect(window.location.search).toBe('?page=3');
    expect(result.current.page).toBe(2);
    act(() => result.current.handlePageSizeChange(50));
    expect(window.location.search).toBe('?page_size=50');
    act(() => result.current.handlePageSizeChange(25));
    expect(window.location.search).toBe('');
    expect(result.current.pageSize).toBe(25);
  });

  it('ignore les paramètres invalides plutôt que transmettre des valeurs arbitraires à l’API', () => {
    window.history.replaceState(
      null,
      '',
      '/admin/users?page=-1&page_size=99999&sort_by=password&sort_dir=bad&is_active=bad&roles=bad,TRAINEE,TRAINEE',
    );
    const { result } = renderHook(() => useUsersListController(options));
    expect(result.current.params).toEqual({
      sort_by: 'created_at',
      sort_dir: 'desc',
      page_size: 25,
      page: 0,
      roles: 'TRAINEE',
    });
    expect(result.current.page).toBe(0);
  });

  it('ignore les filtres tenant/client pour un contexte non autorisé ou le portail', () => {
    window.history.replaceState(null, '', '/users?tenant_id=other&client_id=other&q=Alice');
    const { result } = renderHook(() => useUsersListController({ urlPath: '/users' }));
    expect(result.current.params).not.toHaveProperty('tenant_id');
    expect(result.current.params).not.toHaveProperty('client_id');
    expect(result.current.returnTo).not.toContain('tenant_id');
    expect(result.current.returnTo).not.toContain('client_id');
    expect(result.current.draftSearch).toBe('Alice');
  });

  it('garde les autres paramètres URL et n’ajoute pas d’entrée d’historique', () => {
    window.history.replaceState(null, '', '/admin/users?source=dashboard');
    const length = window.history.length;
    const { result } = renderHook(() => useUsersListController(options));
    act(() => result.current.handlePageChange(2));
    expect(new URLSearchParams(window.location.search).get('source')).toBe('dashboard');
    expect(window.history.length).toBe(length);
  });

  it('efface plusieurs rôles dans le même événement sans écraser les mises à jour précédentes', () => {
    window.history.replaceState(null, '', '/admin/users?roles=TRAINEE,EDITOR&page=2');
    const { result } = renderHook(() => useUsersListController(options));
    act(() => result.current.selectedRoles.forEach(result.current.handleRoleToggle));
    expect(result.current.selectedRoles).toEqual([]);
    expect(result.current.page).toBe(0);
    expect(new URLSearchParams(window.location.search).has('roles')).toBe(false);
  });

  it('laisse les autres consommateurs en état local et ne conserve rien entre deux montages', () => {
    window.history.replaceState(null, '', '/admin/users?q=Alice&page=3');
    const first = renderHook(() => useUsersListController());
    expect(first.result.current.draftSearch).toBe('');
    act(() => first.result.current.handlePageChange(2));
    first.unmount();
    const second = renderHook(() => useUsersListController());
    expect(second.result.current.page).toBe(0);
    expect(window.location.search).toBe('?q=Alice&page=3');
  });
});
