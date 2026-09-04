/**
 * Tests d'intégration — SectionContent (ContentSection.tsx)
 *
 * DynamicContentForm est mocké (il a ses propres tests) pour isoler le
 * comportement propre à SectionContent :
 *
 *  1. Publication bloquée + message adapté (aucun package vs en traitement)
 *  2. Publication autorisée une fois le statut `ready`
 *  3. handleSave : rattache le nouveau package (si différent) avant l'update
 *  4. handleSave : pas de rattachement si le package n'a pas changé
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpdateMutateAsync = jest.fn();
const mockAttachMutateAsync = jest.fn();

jest.mock('../../hooks/useCourseContentApi', () => ({
  useUpdateEntry: () => ({ mutateAsync: mockUpdateMutateAsync, isPending: false }),
  useAttachScormPackage: () => ({ mutateAsync: mockAttachMutateAsync }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Fake pilotable depuis les tests : boutons pour simuler la soumission et les
// changements d'état SCORM remontés par le vrai ScormPackageField.
jest.mock('../forms/DynamicContentForm', () => ({
  DynamicContentForm: ({
    onSubmit,
    onScormStateChange,
  }: {
    onSubmit: (data: Record<string, unknown>) => void;
    onScormStateChange?: (state: { packageId: string | null; status: string | null }) => void;
  }) => (
    <div data-testid="dynamic-form">
      <button type="button" onClick={() => onSubmit({ title: 'Nouveau titre' })}>
        Soumettre
      </button>
      <button
        type="button"
        onClick={() => onScormStateChange?.({ packageId: 'pkg-new', status: 'pending' })}
      >
        Simuler package pending
      </button>
      <button
        type="button"
        onClick={() => onScormStateChange?.({ packageId: 'pkg-new', status: 'ready' })}
      >
        Simuler package ready
      </button>
    </div>
  ),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SectionContent } from '../ContentSection';
import type { ApiContentEntry } from '../../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

const mockToastError = jest.mocked(toast.error);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SCORM_CONTENT_TYPE: ContentTypeResource = {
  id: 'ct-scorm',
  module_type: 'scorm',
  title: 'Module SCORM',
  description: null,
  is_active: true,
  version: 1,
  fields: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function makeEntry(overrides: Partial<ApiContentEntry> = {}): ApiContentEntry {
  return {
    id: 'entry-1',
    content_type_id: 'ct-scorm',
    course_section_id: 'section-1',
    content_type_version: 1,
    data: {},
    is_published: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderSection(entry: ApiContentEntry) {
  return render(
    <TooltipProvider>
      <SectionContent
        sectionId="section-1"
        entry={entry}
        contentType={SCORM_CONTENT_TYPE}
        onDeselect={jest.fn()}
      />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateMutateAsync.mockResolvedValue({ data: makeEntry() });
  mockAttachMutateAsync.mockResolvedValue({ data: makeEntry() });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SectionContent — publication bloquée pour un entry scorm', () => {
  it("le switch est désactivé quand aucun package n'est disponible", () => {
    renderSection(makeEntry({ data: {} }));

    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it("reste désactivé quand un package existe mais n'est pas encore prêt", async () => {
    const user = userEvent.setup();
    renderSection(makeEntry({ data: {} }));

    await user.click(screen.getByText('Simuler package pending'));

    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('devient activable une fois le package prêt', async () => {
    const user = userEvent.setup();
    renderSection(makeEntry({ data: {} }));

    await user.click(screen.getByText('Simuler package ready'));

    expect(screen.getByRole('switch')).toBeEnabled();
  });

  it('publie via updateEntry une fois activé et cliqué', async () => {
    const user = userEvent.setup();
    renderSection(makeEntry({ data: {} }));

    await user.click(screen.getByText('Simuler package ready'));
    await user.click(screen.getByRole('switch'));

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      entryId: 'entry-1',
      sectionId: 'section-1',
      isPublished: true,
    });
  });
});

describe('SectionContent — handleSave (rattachement du package)', () => {
  it('rattache le nouveau package avant de mettre à jour les données', async () => {
    const user = userEvent.setup();
    renderSection(makeEntry({ data: {} }));

    await user.click(screen.getByText('Simuler package ready'));
    await user.click(screen.getByText('Soumettre'));

    expect(mockAttachMutateAsync).toHaveBeenCalledWith({
      entryId: 'entry-1',
      scormPackageId: 'pkg-new',
    });
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      entryId: 'entry-1',
      sectionId: 'section-1',
      data: { title: 'Nouveau titre' },
    });

    const attachOrder = mockAttachMutateAsync.mock.invocationCallOrder[0];
    const updateOrder = mockUpdateMutateAsync.mock.invocationCallOrder[0];
    expect(attachOrder).toBeLessThan(updateOrder);
  });

  it("ne rattache rien si le package n'a pas changé", async () => {
    const user = userEvent.setup();
    renderSection(makeEntry({ data: { scorm_package_id: 'pkg-already-attached' } }));

    await user.click(screen.getByText('Soumettre'));

    expect(mockAttachMutateAsync).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      entryId: 'entry-1',
      sectionId: 'section-1',
      data: { title: 'Nouveau titre' },
    });
  });

  it('affiche une erreur si la sauvegarde échoue', async () => {
    mockUpdateMutateAsync.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderSection(makeEntry({ data: { scorm_package_id: 'pkg-already-attached' } }));

    await user.click(screen.getByText('Soumettre'));

    expect(mockToastError).toHaveBeenCalled();
  });
});
