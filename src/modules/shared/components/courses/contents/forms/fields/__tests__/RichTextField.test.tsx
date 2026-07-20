/**
 * Tests unitaires — RichTextField
 *
 * Vérifie le fonctionnement du champ richtext et de sa toolbar d'image :
 *
 *  1. Toolbar — le bouton "Insérer une image" est visible
 *  2. Dialog  — s'ouvre au clic, se ferme sans effet si annulé
 *  3. Insertion par URL — editor.setImage est appelé avec src/alt/align
 *  4. Insertion par upload — mediaApi.uploadInline est appelé
 *                           puis editor.setImage reçoit dataMediaId
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

// Référence au mock de setImage — accessible grâce au préfixe "mock"
const mockSetImage = jest.fn().mockReturnValue({ run: jest.fn() });

// RichTextEditor — rendu minimal qui expose la toolbar au DOM
jest.mock('@/modules/shared/components/tiptap/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    toolbarExtras,
  }: {
    value: string;
    onChange: (v: unknown) => void;
    toolbarExtras?: (editor: unknown) => unknown;
  }) => {
    // Éditeur mock avec la chaîne chain().focus().setImage()
    const mockEditor = {
      chain: () => ({
        focus: () => ({
          setImage: (attrs: unknown) => mockSetImage(attrs),
        }),
      }),
    };

    return (
      <div>
        {toolbarExtras && (
          <div data-testid="toolbar">{toolbarExtras(mockEditor) as React.ReactNode}</div>
        )}
        <textarea
          data-testid="editor"
          value={value ?? ''}
          readOnly={false}
          onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        />
      </div>
    );
  },
}));

// ImageInsertDialog — interface minimaliste pour piloter les confirmations
jest.mock('@/modules/shared/components/tiptap/ImageInsertDialog', () => ({
  ImageInsertDialog: ({
    open,
    onClose,
    onConfirm,
    onFileUpload,
  }: {
    open: boolean;
    onClose: () => void;
    onConfirm: (attrs: Record<string, unknown>) => void;
    onFileUpload?: (file: File) => Promise<{ mediaId: string }>;
  }) => {
    if (!open) return null;
    return (
      <div role="dialog" aria-label="Propriétés de l'image">
        {/* Confirmer via URL */}
        <button
          data-testid="confirm-url"
          onClick={() => {
            onConfirm({
              src: 'https://example.com/photo.png',
              alt: 'Photo de test',
              width: null,
              height: null,
              align: 'left',
            });
            onClose();
          }}
        >
          Confirmer URL
        </button>
        {/* Confirmer via upload fichier */}
        <button
          data-testid="confirm-upload"
          onClick={async () => {
            if (!onFileUpload) return;
            const file = new File(['img'], 'photo.png', { type: 'image/png' });
            const { mediaId } = await onFileUpload(file);
            onConfirm({
              src: 'blob:test',
              alt: 'photo.png',
              width: null,
              height: null,
              align: 'left',
              mediaId,
            });
            onClose();
          }}
        >
          Confirmer Upload
        </button>
        {/* Fermer sans confirmer */}
        <button data-testid="close-dialog" onClick={onClose}>
          Fermer
        </button>
      </div>
    );
  },
}));

// mediaApi — on contrôle la réponse d'uploadInline
jest.mock('@/shared/api/media.api', () => ({
  mediaApi: {
    upload: jest.fn(),
    uploadInline: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextField } from '../RichTextField';
import { mediaApi } from '@/shared/api/media.api';

const mockMediaApi = mediaApi as jest.Mocked<typeof mediaApi>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const INLINE_MEDIA = {
  id: 'inline-001',
  original_name: 'photo.png',
  url: 'https://cdn.test/photo.png',
  mime_type: 'image/png',
  size_bytes: 8192,
  created_at: '2024-01-01T00:00:00Z',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderRichTextField(onChange = jest.fn()) {
  return render(
    <RichTextField
      value=""
      onChange={onChange}
      label="Description"
      contentTypeId="ct-test"
      fieldId="f-richtext"
    />,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RichTextField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetImage.mockReturnValue({ run: jest.fn() });
  });

  // ── 1. Toolbar ───────────────────────────────────────────────────────────

  describe('Toolbar image', () => {
    it('affiche le bouton "Insérer une image" dans la toolbar', () => {
      renderRichTextField();

      const toolbar = screen.getByTestId('toolbar');
      expect(toolbar).toBeInTheDocument();
      // Le bouton est identifiable par son aria-label
      expect(screen.getByRole('button', { name: /insérer une image/i })).toBeInTheDocument();
    });

    it('le dialog est fermé au chargement initial', () => {
      renderRichTextField();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── 2. Dialog ────────────────────────────────────────────────────────────

  describe("Dialog d'insertion", () => {
    it('ouvre le dialog au clic sur le bouton image', async () => {
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('ferme le dialog sans appeler editor.setImage si annulé', async () => {
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));
      await user.click(screen.getByTestId('close-dialog'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockSetImage).not.toHaveBeenCalled();
    });
  });

  // ── 3. Insertion par URL ─────────────────────────────────────────────────

  describe('Insertion par URL', () => {
    it('appelle editor.setImage avec src, alt et align lors de la confirmation', async () => {
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));
      await user.click(screen.getByTestId('confirm-url'));

      expect(mockSetImage).toHaveBeenCalledWith(
        expect.objectContaining({
          src: 'https://example.com/photo.png',
          alt: 'Photo de test',
          align: 'left',
        }),
      );
    });

    it("n'inclut pas dataMediaId pour une insertion par URL", async () => {
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));
      await user.click(screen.getByTestId('confirm-url'));

      // dataMediaId absent ou undefined — ne doit pas être un UUID
      const call = mockSetImage.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(call.dataMediaId).toBeUndefined();
    });

    it('ferme le dialog après confirmation', async () => {
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));
      await user.click(screen.getByTestId('confirm-url'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ── 4. Insertion par upload ──────────────────────────────────────────────

  describe('Insertion par upload de fichier', () => {
    it('appelle mediaApi.uploadInline avec contentTypeId et fieldId', async () => {
      mockMediaApi.uploadInline.mockResolvedValue({ data: INLINE_MEDIA });
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));
      await user.click(screen.getByTestId('confirm-upload'));

      await waitFor(() => {
        expect(mockMediaApi.uploadInline).toHaveBeenCalledWith(
          expect.any(File),
          'ct-test',
          'f-richtext',
        );
      });
    });

    it('appelle editor.setImage avec dataMediaId après upload réussi', async () => {
      mockMediaApi.uploadInline.mockResolvedValue({ data: INLINE_MEDIA });
      const user = userEvent.setup();
      renderRichTextField();

      await user.click(screen.getByRole('button', { name: /insérer une image/i }));
      await user.click(screen.getByTestId('confirm-upload'));

      await waitFor(() => {
        expect(mockSetImage).toHaveBeenCalledWith(
          expect.objectContaining({ dataMediaId: 'inline-001' }),
        );
      });
    });
  });
});
