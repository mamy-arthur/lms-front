/**
 * Tests d'intégration — ScormPackageField
 *
 * Couvre :
 *  1. État initial — champ d'upload affiché, aucune carte
 *  2. Upload — appelle scormApi.upload, affiche la carte en statut `pending`
 *  3. Statut temps réel (WebSocket) — passage à `ready` : refetch + carte à jour
 *  4. Statut `failed` — message d'erreur, retour au champ d'upload
 *  5. Entrée déjà attachée — fetch initial du statut au montage
 *  6. Bouton « Supprimer » — réinitialise la sélection locale
 *  7. onStateChange — notifié à chaque changement de packageId/status
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/shared/api/scorm.api', () => ({
  scormApi: {
    upload: jest.fn(),
    get: jest.fn(),
  },
}));

// Capture the callbacks passed to the hook so tests can fire fake WS events.
const mockUseScormPackageChannel = jest.fn();
jest.mock('@/shared/hooks/useScormPackageChannel', () => ({
  useScormPackageChannel: (...args: unknown[]) => mockUseScormPackageChannel(...args),
}));

jest.mock('@/modules/shared/components/input-upload/FileUploadField', () => ({
  FileUploadField: ({ onFileSelect }: { onFileSelect: (f: File) => void }) => (
    <button
      type="button"
      onClick={() => onFileSelect(new File(['zip'], 'package.zip', { type: 'application/zip' }))}
    >
      Choisir un fichier
    </button>
  ),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScormPackageField } from '../ScormPackageField';
import { scormApi, type ApiScormPackage } from '@/shared/api/scorm.api';

const mockScormApi = scormApi as jest.Mocked<typeof scormApi>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePackage(overrides: Partial<ApiScormPackage> = {}): ApiScormPackage {
  return {
    id: 'pkg-1',
    content_entry_id: null,
    status: 'pending',
    title: null,
    version: null,
    launch_path: null,
    failure_reason: null,
    original_filename: 'package.zip',
    size_bytes: 2048,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Grabs the onStatusChanged callback the component registered with the hook. */
function getStatusHandler(): (event: {
  packageId: string;
  status: ApiScormPackage['status'];
  errorMessage: string | null;
}) => void {
  const lastCall = mockUseScormPackageChannel.mock.calls.at(-1);
  return lastCall?.[1];
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ScormPackageField — état initial', () => {
  it("affiche le champ d'upload quand aucun package n'est attaché", () => {
    render(<ScormPackageField attachedPackageId={null} />);

    expect(screen.getByText('Choisir un fichier')).toBeInTheDocument();
    expect(mockScormApi.get).not.toHaveBeenCalled();
  });
});

describe('ScormPackageField — upload', () => {
  it('upload un fichier puis affiche la carte en statut pending', async () => {
    const user = userEvent.setup();
    mockScormApi.upload.mockResolvedValue({ data: makePackage({ status: 'pending' }) });
    const onStateChange = jest.fn();

    render(<ScormPackageField attachedPackageId={null} onStateChange={onStateChange} />);
    await user.click(screen.getByText('Choisir un fichier'));

    await waitFor(() => {
      expect(screen.getByText('package.zip')).toBeInTheDocument();
    });
    expect(screen.getByText(/en attente de traitement/i)).toBeInTheDocument();
    expect(onStateChange).toHaveBeenCalledWith({ packageId: 'pkg-1', status: 'pending' });
  });

  it("affiche une erreur si l'upload échoue", async () => {
    const user = userEvent.setup();
    mockScormApi.upload.mockRejectedValue(
      Object.assign(new Error('fail'), { json: { message: 'Fichier trop volumineux.' } }),
    );

    render(<ScormPackageField attachedPackageId={null} />);
    await user.click(screen.getByText('Choisir un fichier'));

    await waitFor(() => {
      expect(screen.getByText('Fichier trop volumineux.')).toBeInTheDocument();
    });
  });
});

describe('ScormPackageField — statut temps réel (WebSocket)', () => {
  it('passe à "ready" sur réception de scorm.status.changed puis refetch le package', async () => {
    const user = userEvent.setup();
    mockScormApi.upload.mockResolvedValue({ data: makePackage({ status: 'pending' }) });
    mockScormApi.get.mockResolvedValue({
      data: makePackage({ status: 'ready', version: '1.2', launch_path: 'index.html' }),
    });
    const onStateChange = jest.fn();

    render(<ScormPackageField attachedPackageId={null} onStateChange={onStateChange} />);
    await user.click(screen.getByText('Choisir un fichier'));
    await waitFor(() => expect(screen.getByText('package.zip')).toBeInTheDocument());

    await act(async () => {
      getStatusHandler()({ packageId: 'pkg-1', status: 'ready', errorMessage: null });
    });

    await waitFor(() => {
      expect(mockScormApi.get).toHaveBeenCalledWith('pkg-1');
      expect(screen.getByText(/prêt · v1\.2/i)).toBeInTheDocument();
    });
    // Uploaded package differs from attachedPackageId (null) — save is required.
    expect(screen.getByText(/cliquez sur « enregistrer »/i)).toBeInTheDocument();
    expect(onStateChange).toHaveBeenLastCalledWith({ packageId: 'pkg-1', status: 'ready' });
  });

  it('affiche le message d\'échec et repropose l\'upload sur scorm.status.changed "failed"', async () => {
    const user = userEvent.setup();
    mockScormApi.upload.mockResolvedValue({ data: makePackage({ status: 'pending' }) });

    render(<ScormPackageField attachedPackageId={null} />);
    await user.click(screen.getByText('Choisir un fichier'));
    await waitFor(() => expect(screen.getByText('package.zip')).toBeInTheDocument());

    await act(async () => {
      getStatusHandler()({
        packageId: 'pkg-1',
        status: 'failed',
        errorMessage: 'Manifeste invalide.',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Manifeste invalide.')).toBeInTheDocument();
      expect(screen.getByText('Choisir un fichier')).toBeInTheDocument();
    });
  });
});

describe('ScormPackageField — entrée déjà attachée', () => {
  it('récupère le statut courant au montage', async () => {
    mockScormApi.get.mockResolvedValue({ data: makePackage({ id: 'pkg-existing', status: 'ready', version: '2004' }) });

    render(<ScormPackageField attachedPackageId="pkg-existing" />);

    expect(screen.getByText(/vérification du statut/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockScormApi.get).toHaveBeenCalledWith('pkg-existing');
      expect(screen.getByText(/prêt · v2004/i)).toBeInTheDocument();
    });
    // Same id as attachedPackageId — no "click save" hint needed.
    expect(screen.queryByText(/cliquez sur « enregistrer »/i)).not.toBeInTheDocument();
  });
});

describe('ScormPackageField — suppression', () => {
  it('le bouton Supprimer réinitialise la sélection et réaffiche l\'upload', async () => {
    const user = userEvent.setup();
    mockScormApi.upload.mockResolvedValue({ data: makePackage({ status: 'ready', version: '1.2' }) });
    const onStateChange = jest.fn();

    render(<ScormPackageField attachedPackageId={null} onStateChange={onStateChange} />);
    await user.click(screen.getByText('Choisir un fichier'));
    await waitFor(() => expect(screen.getByText('package.zip')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /supprimer/i }));

    expect(screen.getByText('Choisir un fichier')).toBeInTheDocument();
    expect(onStateChange).toHaveBeenLastCalledWith({ packageId: null, status: null });
  });
});
