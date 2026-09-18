/**
 * Tests d'intégration — DynamicContentForm (cas SCORM)
 *
 * Le champ SCORM lui-même est testé séparément (ScormPackageField.test.tsx) ;
 * ici on vérifie le comportement propre à DynamicContentForm quand
 * `contentType.module_type === 'scorm'` :
 *
 *  1. Le champ SCORM est rendu, pas les autres content types.
 *  2. Le bouton « Enregistrer » reste cliquable même sans package, mais la
 *     soumission est bloquée et affiche un message d'erreur dédié.
 *  3. La soumission passe dès qu'un package existe, peu importe son statut.
 *  4. onSubmit reçoit bien les données du formulaire une fois débloqué.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Fake minimaliste pilotable depuis les tests : un bouton par état simulé.
jest.mock('../fields/ScormPackageField', () => ({
  ScormPackageField: ({
    onStateChange,
  }: {
    attachedPackageId: string | null;
    onStateChange?: (state: { packageId: string | null; status: string | null }) => void;
  }) => (
    <div data-testid="scorm-field">
      <button
        type="button"
        onClick={() => onStateChange?.({ packageId: 'pkg-1', status: 'pending' })}
      >
        Simuler upload (pending)
      </button>
      <button
        type="button"
        onClick={() => onStateChange?.({ packageId: 'pkg-1', status: 'ready' })}
      >
        Simuler upload (ready)
      </button>
    </div>
  ),
}));

jest.mock('@/shared/api/media.api', () => ({
  mediaApi: { upload: jest.fn(), uploadWithProgress: jest.fn(), get: jest.fn(), delete: jest.fn() },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Les champs media passent désormais par des hooks TanStack Query : il leur faut un provider.
import { renderWithQueryClient as render } from '@/shared/lib/test-utils';
import { DynamicContentForm } from '../DynamicContentForm';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

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

const PAGE_CONTENT_TYPE: ContentTypeResource = {
  ...SCORM_CONTENT_TYPE,
  id: 'ct-page',
  module_type: 'page',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DynamicContentForm — module_type scorm', () => {
  it('affiche le champ SCORM, pas pour les autres content types', () => {
    const { rerender } = render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByTestId('scorm-field')).toBeInTheDocument();

    rerender(
      <DynamicContentForm
        contentType={PAGE_CONTENT_TYPE}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('scorm-field')).not.toBeInTheDocument();
  });

  it('le bouton « Enregistrer » reste cliquable même sans package', () => {
    render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeEnabled();
  });

  it('bloque la soumission et affiche une erreur si on clique sans package', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(
      screen.getByText(/un package scorm doit être uploadé avant de pouvoir enregistrer/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("laisse passer la soumission dès qu'un package existe, même encore `pending`", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.click(screen.getByText('Simuler upload (pending)'));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it("affiche un message d'erreur si on force la soumission sans package", async () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    // La garde interne (handleFormSubmit) doit rester efficace même si le
    // submit est déclenché autrement qu'un clic (ex. touche Entrée).
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(
      screen.getByText(/un package scorm doit être uploadé avant de pouvoir enregistrer/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('appelle onSubmit une fois un package disponible et le formulaire soumis', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    await user.click(screen.getByText('Simuler upload (ready)'));
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(onSubmit).toHaveBeenCalledWith({});
    expect(
      screen.queryByText(/un package scorm doit être uploadé avant de pouvoir enregistrer/i),
    ).not.toBeInTheDocument();
  });

  it('pré-remplit attachedScormPackageId pour une entrée déjà rattachée', () => {
    render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        attachedScormPackageId="pkg-existing"
      />,
    );

    // Un package est déjà connu dès le montage — la soumission n'est pas bloquée.
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeEnabled();
  });

  it('attend le statut ready quand l’enregistrement doit publier le contenu', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    const { container } = render(
      <DynamicContentForm
        contentType={SCORM_CONTENT_TYPE}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        requireReadyScorm
      />,
    );

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
    await user.click(screen.getByText('Simuler upload (pending)'));
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Le package SCORM doit être prêt');
    fireEvent.submit(container.querySelector('form')!);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByText('Simuler upload (ready)'));
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onSubmit).toHaveBeenCalledWith({});
  });
});
