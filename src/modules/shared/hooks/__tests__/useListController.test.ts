/**
 * Tests unitaires — useListController
 *
 * Couvre :
 *  - handleCategoryChange : ajout/retrait multi-select, reset vers 'all'
 *  - handleSearch : q + category + tenant, reset page à 0
 *  - handleSort : tri + inversion de direction
 *  - pagination : handlePageChange / handlePageSizeChange
 *  - hasQuery : calcul correct
 *  - drawer : handleOpenCreate / handleEdit / handleCloseDrawer / handleSuccess
 */

import { act, renderHook } from '@testing-library/react';
import { useListController } from '../useListController';

describe('useListController', () => {
  // ── handleCategoryChange ──────────────────────────────────────────────────

  describe('handleCategoryChange', () => {
    it('ajoute une catégorie sélectionnée dans draftCategory et params.category', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleCategoryChange('cat-1'));

      expect(result.current.draftCategory).toEqual(['cat-1']);
      expect(result.current.params).toMatchObject({ category: 'cat-1', page: 0 });
    });

    it('permet de sélectionner plusieurs catégories (multi-select)', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleCategoryChange('cat-1'));
      act(() => result.current.handleCategoryChange('cat-2'));

      expect(result.current.draftCategory).toEqual(['cat-1', 'cat-2']);
      expect(result.current.params).toMatchObject({ category: 'cat-1,cat-2' });
    });

    it('retire une catégorie déjà sélectionnée en la rappelant, sans effacer les autres', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleCategoryChange('cat-1'));
      act(() => result.current.handleCategoryChange('cat-2'));
      act(() => result.current.handleCategoryChange('cat-1'));

      expect(result.current.draftCategory).toEqual(['cat-2']);
      expect(result.current.params).toMatchObject({ category: 'cat-2' });
    });

    it("revient à ['all'] et category=undefined quand la dernière catégorie est retirée", () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleCategoryChange('cat-1'));
      act(() => result.current.handleCategoryChange('cat-1'));

      expect(result.current.draftCategory).toEqual(['all']);
      expect((result.current.params as Record<string, unknown>).category).toBeUndefined();
    });

    it('appeler avec "all" réinitialise immédiatement la sélection', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleCategoryChange('cat-1'));
      act(() => result.current.handleCategoryChange('cat-2'));
      act(() => result.current.handleCategoryChange('all'));

      expect(result.current.draftCategory).toEqual(['all']);
      expect((result.current.params as Record<string, unknown>).category).toBeUndefined();
    });

    it('remet la page à 0', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handlePageChange(3));
      act(() => result.current.handleCategoryChange('cat-1'));

      expect(result.current.params).toMatchObject({ page: 0 });
    });
  });

  // ── handleSearch ───────────────────────────────────────────────────────────

  describe('handleSearch', () => {
    it('applique q et category (issus de draftCategory) et reset la page', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.setDraftSearch('react'));
      act(() => result.current.handleCategoryChange('cat-1'));
      act(() => result.current.handlePageChange(2));
      act(() => result.current.handleSearch());

      expect(result.current.params).toMatchObject({
        q: 'react',
        category: 'cat-1',
        page: 0,
      });
    });

    it("n'inclut pas tenant_id si includeTenantFilter est false", () => {
      const { result } = renderHook(() => useListController({ includeTenantFilter: false }));

      act(() => result.current.setDraftTenant('tenant-1'));
      act(() => result.current.handleSearch());

      expect((result.current.params as Record<string, unknown>).tenant_id).toBeUndefined();
    });

    it('inclut tenant_id si includeTenantFilter est true et draftTenant différent de "all"', () => {
      const { result } = renderHook(() => useListController({ includeTenantFilter: true }));

      act(() => result.current.setDraftTenant('tenant-1'));
      act(() => result.current.handleSearch());

      expect(result.current.params).toMatchObject({ tenant_id: 'tenant-1' });
    });
  });

  // ── handleSort ─────────────────────────────────────────────────────────────

  describe('handleSort', () => {
    it('applique la colonne de tri avec direction asc par défaut', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleSort('email'));

      expect(result.current.sort).toMatchObject({ column: 'email', direction: 'asc' });
    });

    it('inverse la direction sur un second tri de la même colonne', () => {
      const { result } = renderHook(() =>
        useListController({ defaultSortBy: 'name', defaultSortDir: 'asc' }),
      );

      act(() => result.current.handleSort('name'));
      expect(result.current.sort.direction).toBe('desc');

      act(() => result.current.handleSort('name'));
      expect(result.current.sort.direction).toBe('asc');
    });
  });

  // ── pagination ─────────────────────────────────────────────────────────────

  describe('pagination', () => {
    it('handlePageChange met à jour la page', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handlePageChange(2));
      expect(result.current.page).toBe(2);
    });

    it('handlePageSizeChange met à jour page_size et remet page à 0', () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handlePageChange(3));
      act(() => result.current.handlePageSizeChange(50));

      expect(result.current.pageSize).toBe(50);
      expect(result.current.page).toBe(0);
    });
  });

  // ── hasQuery ───────────────────────────────────────────────────────────────

  describe('hasQuery', () => {
    it('retourne false par défaut (aucun filtre actif)', () => {
      const { result } = renderHook(() => useListController());
      expect(result.current.hasQuery).toBe(false);
    });

    it("retourne true dès qu'une recherche textuelle est saisie", () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.setDraftSearch('react'));
      expect(result.current.hasQuery).toBe(true);
    });

    it("retourne true dès qu'une catégorie est sélectionnée", () => {
      const { result } = renderHook(() => useListController());

      act(() => result.current.handleCategoryChange('cat-1'));
      expect(result.current.hasQuery).toBe(true);
    });
  });

  // ── drawer ─────────────────────────────────────────────────────────────────

  describe('drawer', () => {
    it('handleOpenCreate ouvre le drawer sans item en édition', () => {
      const { result } = renderHook(() => useListController<{ id: string }>());

      act(() => result.current.handleEdit({ id: 'item-1' }));
      act(() => result.current.handleOpenCreate());

      expect(result.current.isDrawerOpen).toBe(true);
      expect(result.current.editingItem).toBeUndefined();
    });

    it("handleEdit ouvre le drawer avec l'item sélectionné", () => {
      const { result } = renderHook(() => useListController<{ id: string }>());

      act(() => result.current.handleEdit({ id: 'item-1' }));

      expect(result.current.isDrawerOpen).toBe(true);
      expect(result.current.editingItem).toEqual({ id: 'item-1' });
    });

    it("handleCloseDrawer et handleSuccess ferment le drawer et effacent l'item", () => {
      const { result } = renderHook(() => useListController<{ id: string }>());

      act(() => result.current.handleEdit({ id: 'item-1' }));
      act(() => result.current.handleCloseDrawer());

      expect(result.current.isDrawerOpen).toBe(false);
      expect(result.current.editingItem).toBeUndefined();

      act(() => result.current.handleEdit({ id: 'item-2' }));
      act(() => result.current.handleSuccess());

      expect(result.current.isDrawerOpen).toBe(false);
      expect(result.current.editingItem).toBeUndefined();
    });
  });
});
