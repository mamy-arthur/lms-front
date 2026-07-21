/**
 * Tests fonctionnels — ModuleDetailDrawer
 *
 * On teste depuis la perspective utilisateur :
 *  - l'affichage du nom, identifiant, catégorie, description
 *  - le fallback "Aucune description" quand la description est vide
 *  - l'affichage des cours liés (avec résolution du nom via availableCourses)
 *  - le fallback "Aucun cours lié"
 *  - l'affichage des dates créé/modifié
 *  - l'appel à onClose quand le Sheet est fermé
 *  - la priorité des données de détail sur les données initiales
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

// ─── Mock hooks ───────────────────────────────────────────────────────────────

const mockUseModule = jest.fn();
const mockUseAvailableCourses = jest.fn();

jest.mock('@/modules/admin/resources/modules/hooks/useModule', () => ({
  useModule: (...args: unknown[]) => mockUseModule(...args),
}));

jest.mock('@/modules/admin/resources/modules/hooks/useAvailableCoursesQuery', () => ({
  useAvailableCoursesQuery: (...args: unknown[]) => mockUseAvailableCourses(...args),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleDetailDrawer } from '../module-detail-drawer';
import type { AvailableCourse, Module } from '../../../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_MODULE: Module = {
  id: 'mod-001',
  shortname: 'Développement Web',
  idnumber: 'DW-001',
  description: '<p>Introduction au développement web.</p>',
  category: 'formation',
  categoryId: null,
  tenantId: '1',
  courseIds: ['course-a', 'course-b'],
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z',
};

const AVAILABLE_COURSES: AvailableCourse[] = [
  { id: 'course-a', fullName: 'HTML & CSS Fondamentaux', categoryId: 'cat-1', categoryName: 'Dev' },
  { id: 'course-b', fullName: 'JavaScript ES6+', categoryId: 'cat-1', categoryName: 'Dev' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  module?: Module;
  open?: boolean;
  onClose?: jest.Mock;
}

function renderDrawer({ module = BASE_MODULE, open = true, onClose = jest.fn() }: RenderOptions = {}) {
  return render(<ModuleDetailDrawer module={module} open={open} onClose={onClose} />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ModuleDetailDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Par défaut : pas de détail enrichi depuis l'API, liste de cours disponibles
    mockUseModule.mockReturnValue({ data: undefined });
    mockUseAvailableCourses.mockReturnValue({ data: AVAILABLE_COURSES });
  });

  // ── Rendu de base ──────────────────────────────────────────────────────────

  describe('rendu de base', () => {
    it("affiche le nom du module dans l'en-tête", () => {
      renderDrawer();
      expect(screen.getByText('Développement Web')).toBeInTheDocument();
    });

    it("affiche l'identifiant du module", () => {
      renderDrawer();
      expect(screen.getByText('DW-001')).toBeInTheDocument();
    });

    it('affiche la catégorie du module', () => {
      renderDrawer();
      expect(screen.getByText('formation')).toBeInTheDocument();
    });

    it("n'affiche pas la catégorie si elle est absente", () => {
      renderDrawer({ module: { ...BASE_MODULE, category: '' } });
      expect(screen.queryByText('formation')).not.toBeInTheDocument();
    });
  });

  // ── Description ────────────────────────────────────────────────────────────

  describe('description', () => {
    it('affiche le contenu HTML de la description', () => {
      renderDrawer();
      expect(screen.getByText('Introduction au développement web.')).toBeInTheDocument();
    });

    it('affiche le fallback "Aucune description" quand la description est vide', () => {
      renderDrawer({ module: { ...BASE_MODULE, description: '' } });
      expect(screen.getByText(/aucune description/i)).toBeInTheDocument();
    });
  });

  // ── Cours liés ─────────────────────────────────────────────────────────────

  describe('cours liés', () => {
    it('affiche le nombre de cours liés', () => {
      renderDrawer();
      expect(screen.getByText(/cours liés \(2\)/i)).toBeInTheDocument();
    });

    it('affiche les noms des cours résolus depuis availableCourses', () => {
      renderDrawer();
      expect(screen.getByText('HTML & CSS Fondamentaux')).toBeInTheDocument();
      expect(screen.getByText('JavaScript ES6+')).toBeInTheDocument();
    });

    it("affiche l'id brut si le cours n'est pas trouvé dans availableCourses", () => {
      mockUseAvailableCourses.mockReturnValue({ data: [] });
      renderDrawer();
      expect(screen.getByText('course-a')).toBeInTheDocument();
      expect(screen.getByText('course-b')).toBeInTheDocument();
    });

    it('affiche le fallback "Aucun cours lié" quand courseIds est vide', () => {
      renderDrawer({ module: { ...BASE_MODULE, courseIds: [] } });
      expect(screen.getByText(/aucun cours lié/i)).toBeInTheDocument();
    });

    it('affiche "Cours liés (0)" quand courseIds est vide', () => {
      renderDrawer({ module: { ...BASE_MODULE, courseIds: [] } });
      expect(screen.getByText(/cours liés \(0\)/i)).toBeInTheDocument();
    });
  });

  // ── Dates ──────────────────────────────────────────────────────────────────

  describe('dates', () => {
    it('affiche la date de création', () => {
      renderDrawer();
      // formatDate('2025-01-15') → '15 janv. 2025' (fr-FR)
      expect(screen.getByText(/créé le/i)).toBeInTheDocument();
      expect(screen.getByText(/15 janv\. 2025|15 janvier 2025/i)).toBeInTheDocument();
    });

    it('affiche la date de modification', () => {
      renderDrawer();
      expect(screen.getByText(/modifié le/i)).toBeInTheDocument();
      expect(screen.getByText(/1 juin 2025|01 juin 2025/i)).toBeInTheDocument();
    });
  });

  // ── Données de détail enrichies ────────────────────────────────────────────

  describe('données de détail', () => {
    it('affiche les données de détail quand useModule retourne des données', () => {
      const detailedModule: Module = {
        ...BASE_MODULE,
        shortname: 'Développement Web (détail)',
        description: '<p>Description enrichie depuis le serveur.</p>',
        courseIds: ['course-a'],
      };
      mockUseModule.mockReturnValue({ data: detailedModule });

      renderDrawer();

      expect(screen.getByText('Développement Web (détail)')).toBeInTheDocument();
      expect(screen.getByText('Description enrichie depuis le serveur.')).toBeInTheDocument();
      expect(screen.getByText(/cours liés \(1\)/i)).toBeInTheDocument();
    });

    it('utilise les données initiales (module prop) si useModule ne renvoie rien', () => {
      mockUseModule.mockReturnValue({ data: undefined });

      renderDrawer();

      expect(screen.getByText('Développement Web')).toBeInTheDocument();
    });
  });

  // ── Comportement ouverture/fermeture ───────────────────────────────────────

  describe('ouverture / fermeture', () => {
    it("n'affiche rien quand open=false", () => {
      renderDrawer({ open: false });
      // Le Sheet fermé ne rend pas son contenu dans le DOM
      expect(screen.queryByText('Développement Web')).not.toBeInTheDocument();
    });

    it('ne passe pas les ids à useModule quand open=false', () => {
      renderDrawer({ open: false });
      // useModule doit être appelé avec undefined quand fermé
      expect(mockUseModule).toHaveBeenCalledWith(undefined, undefined);
    });

    it('passe les ids corrects à useModule quand open=true', () => {
      renderDrawer();
      expect(mockUseModule).toHaveBeenCalledWith('DW-001', 'mod-001');
    });

    it('appelle onClose quand le Sheet émet onOpenChange(false)', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderDrawer({ onClose });

      // Fermeture via la touche Échap (Radix Sheet écoute Escape)
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── Module undefined ───────────────────────────────────────────────────────

  describe('module undefined', () => {
    it("affiche '—' pour le nom si module est undefined", () => {
      mockUseModule.mockReturnValue({ data: undefined });
      render(<ModuleDetailDrawer module={undefined} open={true} onClose={jest.fn()} />);
      // Le SheetTitle est un heading
      expect(screen.getByRole('heading', { name: '—' })).toBeInTheDocument();
    });
  });
});
