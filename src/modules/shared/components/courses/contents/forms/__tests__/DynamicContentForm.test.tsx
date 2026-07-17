/**
 * Tests d'intégration — DynamicContentForm
 *
 * Vérifie le comportement du formulaire dynamique pour l'ajout et l'édition
 * de contenu de cours :
 *
 *  1. Rendu — labels, requis, champs archivés masqués
 *  2. Champs de saisie — texte, textarea, nombre, date, checkbox, richtext
 *  3. Champ média (fichier unique) — upload, affichage du nom, suppression
 *  4. Champ média (multi-fichiers) — ajout, liste, suppression d'un élément
 *  5. Soumission — onSubmit reçoit toutes les valeurs
 *  6. Annulation — onCancel est appelé
 *  7. État isSubmitting — boutons désactivés, spinner affiché
 *  8. Mode édition — initialData pré-remplit les champs
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

// mediaApi — on contrôle les réponses dans chaque test
jest.mock('@/shared/api/media.api', () => ({
  mediaApi: {
    upload: jest.fn(),
    uploadInline: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

// RichTextField — testé séparément ; ici on le réduit à une simple textarea
jest.mock(
  '@/modules/shared/components/courses/contents/forms/fields/RichTextField',
  () => ({
    RichTextField: ({
      value,
      onChange,
      label,
    }: {
      value: unknown;
      onChange: (v: unknown) => void;
      label: string;
    }) => (
      <textarea
        aria-label={label}
        value={(value as string) ?? ''}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
      />
    ),
  }),
);

// FileUploadField — simplifié : bouton "Choisir" + bouton "Supprimer"
jest.mock('@/modules/shared/components/input-upload/FileUploadField', () => ({
  FileUploadField: ({
    fileName,
    onFileSelect,
    onRemove,
  }: {
    fileName?: string;
    onFileSelect: (f: File) => void;
    onRemove: () => void;
  }) => (
    <div data-testid="file-upload">
      {fileName && <span data-testid="current-file">{fileName}</span>}
      <button
        type="button"
        onClick={() => onFileSelect(new File(['content'], 'test.pdf', { type: 'application/pdf' }))}
      >
        Choisir un fichier
      </button>
      <button type="button" onClick={onRemove}>
        Supprimer
      </button>
    </div>
  ),
}));

// MultiFileUploadField — simplifié : un seul bouton "Ajouter"
jest.mock('@/modules/shared/components/input-upload/MultiFileUploadField', () => ({
  MultiFileUploadField: ({
    onFilesChange,
  }: {
    onFilesChange: (files: File[]) => void;
  }) => (
    <button
      type="button"
      data-testid="multi-upload-btn"
      onClick={() =>
        onFilesChange([new File(['content'], 'extra.pdf', { type: 'application/pdf' })])
      }
    >
      Ajouter des fichiers
    </button>
  ),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicContentForm } from '../DynamicContentForm';
import { mediaApi } from '@/shared/api/media.api';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

const mockMediaApi = mediaApi as jest.Mocked<typeof mediaApi>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MEDIA_UPLOADED = {
  id: 'media-001',
  original_name: 'rapport.pdf',
  url: 'https://cdn.test/rapport.pdf',
  mime_type: 'application/pdf',
  size_bytes: 12345,
  created_at: '2024-01-01T00:00:00Z',
};

const MEDIA_UPLOADED_B = {
  id: 'media-002',
  original_name: 'annexe.pdf',
  url: 'https://cdn.test/annexe.pdf',
  mime_type: 'application/pdf',
  size_bytes: 6789,
  created_at: '2024-01-01T00:00:00Z',
};

const EXISTING_MEDIA = {
  id: 'existing-001',
  original_name: 'existant.pdf',
  url: 'https://cdn.test/existant.pdf',
  mime_type: 'application/pdf',
  size_bytes: 9999,
  created_at: '2024-01-01T00:00:00Z',
};

/** ContentType de test avec un champ de chaque type. */
const CONTENT_TYPE: ContentTypeResource = {
  id: 'ct-test',
  module_type: 'page',
  title: 'Fiche test',
  description: null,
  is_active: true,
  version: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  fields: [
    {
      field_id: 'f1',
      type: 'text',
      name: 'titre',
      label: 'Titre',
      required: false,
      is_archived: false,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
    {
      field_id: 'f2',
      type: 'textarea',
      name: 'resume',
      label: 'Résumé',
      required: false,
      is_archived: false,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
    {
      field_id: 'f3',
      type: 'richtext',
      name: 'contenu',
      label: 'Contenu',
      required: false,
      is_archived: false,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
    {
      field_id: 'f4',
      type: 'number',
      name: 'duree',
      label: 'Durée (min)',
      required: false,
      is_archived: false,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
    {
      field_id: 'f5',
      type: 'date',
      name: 'date_debut',
      label: 'Date de début',
      required: false,
      is_archived: false,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
    {
      field_id: 'f6',
      type: 'checkbox',
      name: 'actif',
      label: 'Actif',
      required: false,
      is_archived: false,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
    {
      field_id: 'f7',
      type: 'media',
      name: 'fichier',
      label: 'Fichier',
      required: false,
      is_archived: false,
      accept: ['application/pdf'],
      max_size_mb: 10,
      multiple: false,
    },
    {
      field_id: 'f8',
      type: 'media',
      name: 'ressources',
      label: 'Ressources',
      required: false,
      is_archived: false,
      accept: ['application/pdf'],
      max_size_mb: 10,
      multiple: true,
    },
    {
      field_id: 'f9',
      type: 'text',
      name: 'archive',
      label: 'Champ archivé',
      required: false,
      is_archived: true,
      accept: [],
      max_size_mb: null,
      multiple: false,
    },
  ],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderForm(options: {
  initialData?: Record<string, unknown>;
  isSubmitting?: boolean;
  onSubmit?: jest.Mock;
  onCancel?: jest.Mock;
} = {}) {
  const onSubmit = options.onSubmit ?? jest.fn();
  const onCancel = options.onCancel ?? jest.fn();
  const result = render(
    <DynamicContentForm
      contentType={CONTENT_TYPE}
      initialData={options.initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={options.isSubmitting ?? false}
    />,
  );
  return { ...result, onSubmit, onCancel };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DynamicContentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 1. Rendu ─────────────────────────────────────────────────────────────

  describe('Rendu initial', () => {
    it('affiche les labels de tous les champs actifs', () => {
      renderForm();

      // Les labels shadcn ne sont pas associés aux inputs via htmlFor/id,
      // on vérifie donc le texte visible dans le DOM.
      expect(screen.getByText('Titre')).toBeInTheDocument();
      expect(screen.getByText('Résumé')).toBeInTheDocument();
      expect(screen.getByText('Contenu')).toBeInTheDocument();
      expect(screen.getByText('Durée (min)')).toBeInTheDocument();
      expect(screen.getByText('Date de début')).toBeInTheDocument();
      expect(screen.getByText('Actif')).toBeInTheDocument();
    });

    it("affiche l'astérisque rouge pour les champs requis", () => {
      // Rend un content type avec un champ requis pour ce test uniquement
      const { container } = render(
        <DynamicContentForm
          contentType={{
            ...CONTENT_TYPE,
            fields: [{ ...CONTENT_TYPE.fields[0], required: true }],
          }}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
      const asterisk = container.querySelector('.text-destructive');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveTextContent('*');
    });

    it("n'affiche PAS les champs archivés", () => {
      renderForm();
      expect(screen.queryByLabelText('Champ archivé')).not.toBeInTheDocument();
      expect(screen.queryByText('Champ archivé')).not.toBeInTheDocument();
    });

    it('affiche les boutons Enregistrer et Annuler', () => {
      renderForm();
      expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });
  });

  // ── 2. Champs de saisie ──────────────────────────────────────────────────

  describe('Champs de saisie', () => {
    it('text : la saisie est transmise à onSubmit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.type(screen.getByPlaceholderText('Titre'), 'Mon titre de cours');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ titre: 'Mon titre de cours' }),
      );
    });

    it('textarea : la saisie est transmise à onSubmit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.type(screen.getByPlaceholderText('Résumé'), 'Un résumé détaillé');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ resume: 'Un résumé détaillé' }),
      );
    });

    it('richtext : la saisie est transmise à onSubmit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      // Le mock RichTextField rend une textarea avec aria-label
      await user.type(screen.getByLabelText('Contenu'), 'Du contenu richtext');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ contenu: 'Du contenu richtext' }),
      );
    });

    it('number : la valeur numérique est transmise à onSubmit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      const numberInput = screen.getByPlaceholderText('Durée (min)');
      await user.clear(numberInput);
      await user.type(numberInput, '45');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ duree: 45 }),
      );
    });

    it('date : la valeur date est transmise à onSubmit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      // input[type=date] n'a pas de placeholder — on le cible par type
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.type(dateInput, '2024-09-01');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ date_debut: '2024-09-01' }),
      );
    });

    it('checkbox : le clic transmet true à onSubmit', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ actif: true }),
      );
    });
  });

  // ── 3. Champ média (fichier unique) ──────────────────────────────────────

  describe('Champ média (fichier unique)', () => {
    it("appelle mediaApi.upload avec l'id du content type et du champ", async () => {
      mockMediaApi.upload.mockResolvedValue({ data: MEDIA_UPLOADED });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByText('Choisir un fichier'));

      await waitFor(() => {
        expect(mockMediaApi.upload).toHaveBeenCalledWith(
          expect.any(File),
          'ct-test',
          'f7',
        );
      });
    });

    it('affiche le nom du fichier après upload', async () => {
      mockMediaApi.upload.mockResolvedValue({ data: MEDIA_UPLOADED });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByText('Choisir un fichier'));

      await waitFor(() => {
        expect(screen.getByTestId('current-file')).toHaveTextContent('rapport.pdf');
      });
    });

    it("inclut l'UUID du média dans onSubmit après upload", async () => {
      mockMediaApi.upload.mockResolvedValue({ data: MEDIA_UPLOADED });
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByText('Choisir un fichier'));
      await waitFor(() => expect(mockMediaApi.upload).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ fichier: 'media-001' }),
      );
    });

    it('appelle mediaApi.delete et remet null lors de la suppression', async () => {
      mockMediaApi.upload.mockResolvedValue({ data: MEDIA_UPLOADED });
      mockMediaApi.delete.mockResolvedValue(undefined);
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByText('Choisir un fichier'));
      await waitFor(() => expect(mockMediaApi.upload).toHaveBeenCalled());

      await user.click(screen.getByText('Supprimer'));

      await waitFor(() => {
        expect(mockMediaApi.delete).toHaveBeenCalledWith('media-001');
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ fichier: null }),
      );
    });
  });

  // ── 4. Champ média (multi-fichiers) ──────────────────────────────────────

  describe('Champ média (multi-fichiers)', () => {
    it("appelle mediaApi.upload avec l'id du content type et du champ multi", async () => {
      mockMediaApi.upload.mockResolvedValue({ data: MEDIA_UPLOADED });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByTestId('multi-upload-btn'));

      await waitFor(() => {
        expect(mockMediaApi.upload).toHaveBeenCalledWith(
          expect.any(File),
          'ct-test',
          'f8',
        );
      });
    });

    it('affiche le nom du fichier dans la liste après upload', async () => {
      mockMediaApi.upload.mockResolvedValue({ data: MEDIA_UPLOADED });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByTestId('multi-upload-btn'));

      await waitFor(() => {
        expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
      });
    });

    it('accumule plusieurs fichiers dans la liste', async () => {
      mockMediaApi.upload
        .mockResolvedValueOnce({ data: MEDIA_UPLOADED })
        .mockResolvedValueOnce({ data: MEDIA_UPLOADED_B });
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByTestId('multi-upload-btn'));
      await waitFor(() => expect(screen.getByText('rapport.pdf')).toBeInTheDocument());

      await user.click(screen.getByTestId('multi-upload-btn'));
      await waitFor(() => {
        expect(screen.getByText('rapport.pdf')).toBeInTheDocument();
        expect(screen.getByText('annexe.pdf')).toBeInTheDocument();
      });
    });

    it('inclut tous les UUIDs dans onSubmit', async () => {
      mockMediaApi.upload
        .mockResolvedValueOnce({ data: MEDIA_UPLOADED })
        .mockResolvedValueOnce({ data: MEDIA_UPLOADED_B });
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByTestId('multi-upload-btn'));
      await waitFor(() => expect(screen.getByText('rapport.pdf')).toBeInTheDocument());
      await user.click(screen.getByTestId('multi-upload-btn'));
      await waitFor(() => expect(screen.getByText('annexe.pdf')).toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ressources: ['media-001', 'media-002'],
        }),
      );
    });
  });

  // ── 5. Soumission ────────────────────────────────────────────────────────

  describe('Soumission', () => {
    it('appelle onSubmit lors du clic sur Enregistrer', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('initialise les champs media à null / [] avant toute interaction', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fichier: null,
          ressources: [],
        }),
      );
    });
  });

  // ── 6. Annulation ────────────────────────────────────────────────────────

  describe('Annulation', () => {
    it('appelle onCancel lors du clic sur Annuler', async () => {
      const user = userEvent.setup();
      const { onCancel } = renderForm();

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("n'appelle pas onSubmit lors du clic sur Annuler", async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderForm();

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ── 7. État isSubmitting ─────────────────────────────────────────────────

  describe('État isSubmitting', () => {
    it('désactive les boutons Enregistrer et Annuler', () => {
      renderForm({ isSubmitting: true });

      expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled();
    });

    it('affiche le spinner sur le bouton Enregistrer', () => {
      renderForm({ isSubmitting: true });

      const submitBtn = screen.getByRole('button', { name: /enregistrer/i });
      // Le spinner est un svg avec la classe animate-spin
      expect(submitBtn.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  // ── 8. Mode édition (initialData) ────────────────────────────────────────

  describe('Mode édition (initialData)', () => {
    it('pré-remplit les champs texte', () => {
      renderForm({
        initialData: {
          titre: 'Titre existant',
          resume: 'Résumé existant',
        },
      });

      expect(screen.getByPlaceholderText('Titre')).toHaveValue('Titre existant');
      expect(screen.getByPlaceholderText('Résumé')).toHaveValue('Résumé existant');
    });

    it('pré-remplit le champ richtext', () => {
      renderForm({
        initialData: { contenu: 'Contenu existant en markdown' },
      });

      // Le mock RichTextField rend une textarea avec aria-label
      expect(screen.getByLabelText('Contenu')).toHaveValue('Contenu existant en markdown');
    });

    it("charge le média existant via mediaApi.get au montage", async () => {
      mockMediaApi.get.mockResolvedValue({ data: EXISTING_MEDIA });

      renderForm({
        initialData: { fichier: 'existing-001' },
      });

      await waitFor(() => {
        expect(mockMediaApi.get).toHaveBeenCalledWith('existing-001');
      });
    });

    it('affiche le nom du fichier existant après chargement', async () => {
      mockMediaApi.get.mockResolvedValue({ data: EXISTING_MEDIA });

      renderForm({
        initialData: { fichier: 'existing-001' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-file')).toHaveTextContent('existant.pdf');
      });
    });

    it('normalise les médias au format objet { id, url } vers un UUID', async () => {
      const user = userEvent.setup();
      // mediaApi.get est appelé au montage pour charger le média existant
      mockMediaApi.get.mockResolvedValue({ data: EXISTING_MEDIA });
      const { onSubmit } = renderForm({
        initialData: {
          fichier: { id: 'media-expanded', url: 'https://cdn.test/f.pdf', original_name: 'f.pdf' },
        },
      });

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ fichier: 'media-expanded' }),
      );
    });
  });
});
