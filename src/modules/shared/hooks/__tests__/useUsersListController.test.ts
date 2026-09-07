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
