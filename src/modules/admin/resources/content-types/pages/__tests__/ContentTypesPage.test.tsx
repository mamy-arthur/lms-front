/**
 * Tests fonctionnels — ContentTypesPage
 *
 * On teste la gestion d'état de la page (ouverture du formulaire, sélection
 * pour édition, calcul des modules déjà utilisés) en mockant les hooks React
 * Query et les composants enfants complexes.
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

jest.mock('@/modules/admin/resources/content-types/hooks/useContentTypesQuery', () => ({
  useContentTypes: jest.fn(),
}));

// Les mutations ne sont pas utilisées par la page elle-même mais par ContentTypeForm.
// On les mock pour éviter les imports de dépendances React Query non wrappées.
jest.mock('@/modules/admin/resources/content-types/hooks/useCreateContentType', () => ({
  useCreateContentType: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/modules/admin/resources/content-types/hooks/useUpdateContentType', () => ({
  useUpdateContentType: () => ({ mutate: jest.fn(), isPending: false }),
}));

/**
 * ContentTypeTable est mocké pour capturer les props reçues (callbacks inclus)
 * sans rendre le tableau réel.
 */
const mockTableProps = jest.fn();
jest.mock('@/modules/admin/resources/content-types/pages/_components/content-type-table', () => ({
  ContentTypeTable: (props: object) => {
    mockTableProps(props);
    return <div data-testid="content-type-table" />;
  },
}));

/**
 * ContentTypeForm est mocké pour capturer les props (open, contentType,
 * usedModuleTypes) sans rendre le Sheet Radix.
 */
const mockFormProps = jest.fn();
jest.mock('@/modules/admin/resources/content-types/pages/_components/content-type-form', () => ({
  ContentTypeForm: (props: object) => {
    mockFormProps(props);
    return null;
  },
}));

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContentTypes } from '@/modules/admin/resources/content-types/hooks/useContentTypesQuery';
import { ContentTypesPage } from '../ContentTypesPage';
import type { ContentType } from '../../types';

const mockUseContentTypes = jest.mocked(useContentTypes);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CT_PAGE: ContentType = {
  id: 'ct-1',
  module_type: 'page',
  title: 'Fiche pédagogique',
  description: '',
  fields: [],
};

const CT_FILE: ContentType = {
  id: 'ct-2',
  module_type: 'file',
  title: 'Ressource fichier',
  description: '',
  fields: [],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Renvoie les dernières props reçues par ContentTypeForm. */
function lastFormProps() {
  const calls = mockFormProps.mock.calls;
  return calls[calls.length - 1]?.[0] as {
    open: boolean;
    contentType: ContentType | undefined;
    usedModuleTypes: string[];
    onOpenChange: (open: boolean) => void;
  };
}

/** Renvoie les dernières props reçues par ContentTypeTable. */
function lastTableProps() {
  const calls = mockTableProps.mock.calls;
  return calls[calls.length - 1]?.[0] as {
    contentTypes: ContentType[];
    isLoading: boolean;
    onEdit: (ct: ContentType) => void;
    onView: (ct: ContentType) => void;
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContentTypesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // État par défaut : liste vide, pas de chargement
    mockUseContentTypes.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useContentTypes>);
  });

  // ── Rendu initial ──────────────────────────────────────────────────────────

  it('affiche le titre de la page', () => {
    render(<ContentTypesPage />);
    expect(screen.getByRole('heading', { name: /type de contenu/i })).toBeInTheDocument();
  });

  it('affiche le bouton de création', () => {
    render(<ContentTypesPage />);
    expect(screen.getByRole('button', { name: /nouveau type de contenu/i })).toBeInTheDocument();
  });

  it('transmet isLoading=true à ContentTypeTable pendant le chargement', () => {
    mockUseContentTypes.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useContentTypes>);

    render(<ContentTypesPage />);

    expect(lastTableProps().isLoading).toBe(true);
  });

  it('transmet la liste des content types à ContentTypeTable', () => {
    mockUseContentTypes.mockReturnValue({
      data: { data: [CT_PAGE, CT_FILE] },
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);

    render(<ContentTypesPage />);

    expect(lastTableProps().contentTypes).toEqual([CT_PAGE, CT_FILE]);
  });

  it('transmet une liste vide quand data est undefined', () => {
    mockUseContentTypes.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);

    render(<ContentTypesPage />);

    expect(lastTableProps().contentTypes).toEqual([]);
  });

  // ── Formulaire de création ─────────────────────────────────────────────────

  it('le formulaire est fermé par défaut', () => {
    render(<ContentTypesPage />);
    expect(lastFormProps().open).toBe(false);
    expect(lastFormProps().contentType).toBeUndefined();
  });

  it('ouvre le formulaire en mode création au clic sur "Nouveau"', async () => {
    const user = userEvent.setup();
    render(<ContentTypesPage />);

    await user.click(screen.getByRole('button', { name: /nouveau type de contenu/i }));

    expect(lastFormProps().open).toBe(true);
    expect(lastFormProps().contentType).toBeUndefined();
  });

  it('ferme le formulaire quand onOpenChange(false) est appelé', async () => {
    const user = userEvent.setup();
    render(<ContentTypesPage />);

    await user.click(screen.getByRole('button', { name: /nouveau type de contenu/i }));
    expect(lastFormProps().open).toBe(true);

    act(() => {
      lastFormProps().onOpenChange(false);
    });

    expect(lastFormProps().open).toBe(false);
  });

  // ── Formulaire d'édition ───────────────────────────────────────────────────

  it('ouvre le formulaire en mode édition avec le bon content type', () => {
    mockUseContentTypes.mockReturnValue({
      data: { data: [CT_PAGE] },
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);
    render(<ContentTypesPage />);

    act(() => {
      lastTableProps().onEdit(CT_PAGE);
    });

    expect(lastFormProps().open).toBe(true);
    expect(lastFormProps().contentType).toEqual(CT_PAGE);
  });

  it('réinitialise contentType quand le formulaire est fermé après édition', () => {
    mockUseContentTypes.mockReturnValue({
      data: { data: [CT_PAGE] },
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);
    render(<ContentTypesPage />);

    act(() => {
      lastTableProps().onEdit(CT_PAGE);
    });
    expect(lastFormProps().contentType).toEqual(CT_PAGE);

    act(() => {
      lastFormProps().onOpenChange(false);
    });
    expect(lastFormProps().contentType).toBeUndefined();
  });

  it("supporte l'ouverture via onView", () => {
    mockUseContentTypes.mockReturnValue({
      data: { data: [CT_PAGE] },
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);
    render(<ContentTypesPage />);

    act(() => {
      lastTableProps().onView(CT_PAGE);
    });

    expect(lastFormProps().open).toBe(true);
    expect(lastFormProps().contentType).toEqual(CT_PAGE);
  });

  // ── usedModuleTypes ────────────────────────────────────────────────────────

  it('transmet tous les module_type existants comme usedModuleTypes en mode création', async () => {
    const user = userEvent.setup();
    mockUseContentTypes.mockReturnValue({
      data: { data: [CT_PAGE, CT_FILE] },
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);
    render(<ContentTypesPage />);

    await user.click(screen.getByRole('button', { name: /nouveau type de contenu/i }));

    expect(lastFormProps().usedModuleTypes).toContain('page');
    expect(lastFormProps().usedModuleTypes).toContain('file');
  });

  it("exclut le module_type du content type en cours d'édition de usedModuleTypes", () => {
    mockUseContentTypes.mockReturnValue({
      data: { data: [CT_PAGE, CT_FILE] },
      isLoading: false,
    } as ReturnType<typeof useContentTypes>);
    render(<ContentTypesPage />);

    // On édite CT_PAGE (module_type = 'page')
    act(() => {
      lastTableProps().onEdit(CT_PAGE);
    });

    // 'page' ne doit pas apparaître (c'est le module du CT édité)
    expect(lastFormProps().usedModuleTypes).not.toContain('page');
    // 'file' doit rester (c'est un autre CT)
    expect(lastFormProps().usedModuleTypes).toContain('file');
  });

  it("usedModuleTypes est vide quand aucun content type n'existe", async () => {
    const user = userEvent.setup();
    render(<ContentTypesPage />); // data: []

    await user.click(screen.getByRole('button', { name: /nouveau type de contenu/i }));

    expect(lastFormProps().usedModuleTypes).toHaveLength(0);
  });
});
