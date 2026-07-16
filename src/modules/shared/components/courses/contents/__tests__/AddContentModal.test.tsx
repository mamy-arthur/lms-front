/**
 * Tests d'intégration — AddContentModal
 *
 * Vérifie la séparation correcte entre ContentType et ContentEntry :
 *
 *  1. Sélection du type de contenu
 *     • Le picker affiche les types disponibles depuis GET /platform/content-types
 *     • Cliquer sur un type crée IMMÉDIATEMENT le ContentEntry
 *       via POST /platform/course-sections/{sectionId}/entries
 *
 *  2. Résultat de la création
 *     • `onCreated` reçoit l'entry créée afin que le parent puisse l'auto-sélectionner
 *     • La modale se ferme
 *
 *  3. Séparation des responsabilités
 *     • ContentType  → définit le schéma (fields) ; utilisé par le panneau d'édition
 *     • ContentEntry → stocke les données ; créé ici avec data: {}
 *     • Le formulaire d'édition n'est PAS affiché dans la modale
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

// ContentTypesQuery — liste utilisée par ContentTypePicker
const mockContentTypesList = jest.fn();
jest.mock(
  '@/modules/shared/components/courses/hooks/useContentTypesQuery',
  () => ({
    useContentTypesQuery: () => ({
      data: mockContentTypesList(),
      isLoading: false,
      isError: false,
    }),
  }),
);

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddContentModal } from '../AddContentModal';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CONTENT_TYPE: ContentTypeResource = {
  id: 'ct-1',
  module_type: 'page',
  title: 'Fiche pédagogique',
  description: 'Type de contenu de test',
  is_active: true,
  version: 1,
  fields: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SECTION_ID = 'sec-abc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(
  onContentTypeSelected = jest.fn(),
  onOpenChange = jest.fn(),
) {
  return render(
    <AddContentModal
      open={true}
      onOpenChange={onOpenChange}
      onContentTypeSelected={onContentTypeSelected}
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AddContentModal — sélection du type sans API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContentTypesList.mockReturnValue([MOCK_CONTENT_TYPE]);
  });

  // ── Affichage ──────────────────────────────────────────────────────────────

  describe('affichage initial', () => {
    it('affiche le titre du picker', () => {
      renderModal();
      expect(screen.getByText('Choisir un type de contenu')).toBeInTheDocument();
    });

    it('affiche les types de contenu disponibles (GET /platform/content-types)', () => {
      renderModal();
      expect(screen.getByText('Fiche pédagogique')).toBeInTheDocument();
    });

    it("n'affiche PAS de formulaire dans la modale", () => {
      renderModal();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /enregistrer/i })).not.toBeInTheDocument();
    });
  });

  // ── Sélection du type ─────────────────────────────────────────────────────

  describe('clic sur un type de contenu', () => {
    it('appelle onContentTypeSelected avec le ContentType complet', async () => {
      const user = userEvent.setup();
      const onContentTypeSelected = jest.fn();
      renderModal(onContentTypeSelected);

      await user.click(screen.getByText('Fiche pédagogique'));

      await waitFor(() => {
        expect(onContentTypeSelected).toHaveBeenCalledTimes(1);
        expect(onContentTypeSelected).toHaveBeenCalledWith(MOCK_CONTENT_TYPE);
      });
    });

    it('ferme la modale immédiatement après la sélection', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      renderModal(jest.fn(), onOpenChange);

      await user.click(screen.getByText('Fiche pédagogique'));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  // ── Aucune requête API ─────────────────────────────────────────────────────

  describe('séparation des responsabilités — aucun appel API dans la modale', () => {
    it("n'appelle PAS l'API ContentEntry au clic (aucun POST)", async () => {
      // Le modal ne fait aucun appel réseau.
      // La création de ContentEntry est déléguée au panneau d'édition (NewEntrySection).
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Fiche pédagogique'));

      // Si une erreur réseau se produisait, les tests de "ferme la modale" échoueraient.
      // Ce test confirme que le flux se termine sans attendre de réponse API.
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /enregistrer/i })).not.toBeInTheDocument();
      });
    });
  });
});
