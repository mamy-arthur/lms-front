jest.mock('@/shared/api/content-entries.api', () => ({
  contentEntriesApi: { create: jest.fn(), update: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../forms/DynamicContentForm', () => ({
  DynamicContentForm: ({
    onSubmit,
    onScormStateChange,
    isSubmitting,
  }: {
    onSubmit: (data: Record<string, unknown>) => void;
    onScormStateChange: (state: { packageId: string; status: string }) => void;
    isSubmitting: boolean;
  }) => (
    <div>
      <button disabled={isSubmitting} onClick={() => onSubmit({ title: 'Contenu' })}>
        Enregistrer
      </button>
      <button onClick={() => onScormStateChange({ packageId: 'pkg-1', status: 'pending' })}>
        Package en traitement
      </button>
      <button onClick={() => onScormStateChange({ packageId: 'pkg-1', status: 'ready' })}>
        Package prêt
      </button>
    </div>
  ),
}));

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contentEntriesApi } from '@/shared/api/content-entries.api';
import { contentEntryKeys } from '@/shared/queries/keys';
import type { ApiContentEntry } from '@/shared/types/course.types';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import { NewEntrySection } from '../NewEntrySection';

const create = jest.mocked(contentEntriesApi.create);
const update = jest.mocked(contentEntriesApi.update);
const CONTENT_TYPE: ContentTypeResource = {
  id: 'ct-1',
  module_type: 'page',
  title: 'Page',
  description: null,
  is_active: true,
  version: 1,
  fields: [],
  created_at: '',
  updated_at: '',
};
const DRAFT: ApiContentEntry = {
  id: 'entry-1',
  content_type_id: 'ct-1',
  course_section_id: 'section-1',
  rank: 0,
  content_type_version: 1,
  data: { title: 'Contenu' },
  is_published: false,
  created_at: '',
  updated_at: '',
};
const PUBLISHED = { ...DRAFT, is_published: true };

function setup(contentType = CONTENT_TYPE, locked = false) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const onCreated = jest.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <NewEntrySection
        sectionId="section-1"
        contentType={contentType}
        onCreated={onCreated}
        onCancel={jest.fn()}
        locked={locked}
      />
    </QueryClientProvider>,
  );
  return { ...view, client, onCreated, user: userEvent.setup() };
}

beforeEach(() => {
  jest.resetAllMocks();
  create.mockResolvedValue({ data: DRAFT });
  update.mockResolvedValue({ data: PUBLISHED });
});

describe('Publication sélectionnée par défaut à la création du contenu', () => {
  it('crée puis publie et conserve le statut publié dans la sélection et le cache', async () => {
    const { user, client, onCreated } = setup();
    expect(screen.getByRole('switch', { name: 'Publié' })).toBeChecked();
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(screen.queryByText('Brouillon')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(PUBLISHED));
    expect(create).toHaveBeenCalledWith('section-1', {
      content_type_id: 'ct-1',
      data: { title: 'Contenu' },
    });
    expect(update).toHaveBeenCalledWith('entry-1', { is_published: true });
    expect(create.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
    expect(client.getQueryData(contentEntryKeys.list('section-1'))).toEqual([PUBLISHED]);
    expect(toast.success).toHaveBeenCalledWith('Contenu créé et publié');
  });

  it('permet de décocher Publié pour enregistrer un brouillon', async () => {
    const { user, client, onCreated } = setup();
    await user.click(screen.getByRole('switch', { name: 'Publié' }));
    expect(screen.getByRole('switch', { name: 'Brouillon' })).not.toBeChecked();
    expect(update).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(DRAFT));
    expect(update).not.toHaveBeenCalled();
    expect(client.getQueryData(contentEntryKeys.list('section-1'))).toEqual([DRAFT]);
    expect(toast.success).toHaveBeenCalledWith('Contenu créé');
  });

  it('permet d’enregistrer un SCORM en traitement comme brouillon', async () => {
    const { user, onCreated } = setup({ ...CONTENT_TYPE, module_type: 'scorm' });
    await user.click(screen.getByRole('switch', { name: 'Publié' }));
    await user.click(screen.getByText('Package en traitement'));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(DRAFT));
    expect(create).toHaveBeenCalledWith('section-1', {
      content_type_id: 'ct-1',
      data: { title: 'Contenu' },
      scorm_package_id: 'pkg-1',
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('attend la publication sans permettre une seconde création', async () => {
    let acknowledge!: (response: { data: ApiContentEntry }) => void;
    update.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acknowledge = resolve;
        }),
    );
    const { user, onCreated } = setup();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(create).toHaveBeenCalledTimes(1);
    await act(async () => {
      acknowledge({ data: PUBLISHED });
    });
    expect(onCreated).toHaveBeenCalledWith(PUBLISHED);
  });

  it('ouvre l’entrée déjà créée si la publication échoue, sans annoncer un succès', async () => {
    update.mockRejectedValueOnce(new Error('Publication refusée'));
    const { user, client, onCreated } = setup();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(DRAFT));
    expect(create).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(contentEntryKeys.list('section-1'))).toEqual([DRAFT]);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Contenu créé, mais non publié.'),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('ne tente pas de publier si la création échoue', async () => {
    create.mockRejectedValueOnce(new Error('Création refusée'));
    const { user, onCreated } = setup();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(update).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('ne crée aucun contenu dans un cours verrouillé', () => {
    setup(CONTENT_TYPE, true);
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('attend un SCORM prêt puis le rattache avant de publier', async () => {
    const { user, onCreated } = setup({ ...CONTENT_TYPE, module_type: 'scorm' });
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(create).not.toHaveBeenCalled();
    await user.click(screen.getByText('Package en traitement'));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(create).not.toHaveBeenCalled();

    await user.click(screen.getByText('Package prêt'));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(PUBLISHED));
    expect(create).toHaveBeenCalledWith('section-1', {
      content_type_id: 'ct-1',
      data: { title: 'Contenu' },
      scorm_package_id: 'pkg-1',
    });
    expect(update).toHaveBeenCalledWith('entry-1', { is_published: true });
  });
});
