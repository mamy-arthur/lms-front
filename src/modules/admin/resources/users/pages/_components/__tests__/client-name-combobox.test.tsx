jest.mock('@/modules/admin/resources/clients/api', () => ({
  adminClientsApi: { resolveName: jest.fn() },
}));

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ADMIN_CLIENTS_QUERY_KEY,
  adminClientsApi,
  normalizeClient,
} from '@/modules/admin/resources/clients';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import { ClientNameCombobox } from '../client-name-combobox';

const onSelectExisting = jest.fn();
const onUseNewName = jest.fn();
const CLIENT = normalizeClient({ id: 'client-a', name: 'B-B', slug: 'b-b', tenant_id: 'tenant-a' });
const PROPS = {
  clients: [CLIENT],
  tenantId: 'tenant-a',
  clientId: null,
  clientName: null,
  onSelectExisting,
  onUseNewName,
};

async function search(name: string) {
  const interaction = userEvent.setup();
  await interaction.click(screen.getByRole('combobox', { name: 'Client' }));
  fireEvent.change(screen.getByPlaceholderText(/Nom du client/), { target: { value: name } });
  return interaction;
}

describe('ClientNameCombobox - resolution canonique', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(adminClientsApi.resolveName).mockReset();
  });

  it.each([
    { name: 'C\u0153ur', slug: 'coeur', existingName: 'Coeur' },
    { name: 'Stra\u00dfe', slug: 'strasse', existingName: 'Strasse' },
    { name: 'B@B', slug: 'b-at-b', existingName: 'B at B' },
    { name: '\u00c9cole', slug: 'ecole', existingName: 'Ecole' },
    { name: 'ACME corp.', slug: 'acme-corp', existingName: 'Acme Corp' },
  ])(
    'retrouve $name selon le slug retourne par le backend',
    async ({ name, slug, existingName }) => {
      const existing = normalizeClient({ ...CLIENT, name: existingName, slug });
      jest
        .mocked(adminClientsApi.resolveName)
        .mockResolvedValue({ data: [existing], meta: { name_slug: slug } });
      renderWithQueryClient(<ClientNameCombobox {...PROPS} clients={[existing]} />);
      const interaction = await search(name);
      const option = await screen.findByRole('option', { name: existingName });
      expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
      await interaction.click(option);
      expect(adminClientsApi.resolveName).toHaveBeenCalledWith(name, 'tenant-a');
      expect(onSelectExisting).toHaveBeenCalledWith(existing);
      expect(onUseNewName).not.toHaveBeenCalled();
    },
  );

  it('permet B@B quand seul B-B existe', async () => {
    jest
      .mocked(adminClientsApi.resolveName)
      .mockResolvedValue({ data: [CLIENT], meta: { name_slug: 'b-at-b' } });
    renderWithQueryClient(<ClientNameCombobox {...PROPS} />);
    const interaction = await search('B@B');
    await interaction.click(await screen.findByRole('option', { name: /Cr.er le client.*B@B/ }));
    expect(onUseNewName).toHaveBeenCalledWith('B@B');
    expect(onSelectExisting).not.toHaveBeenCalled();
  });

  it('compare le slug stocke plutot que de recalculer le nom affiche', async () => {
    const renamed = normalizeClient({ ...CLIENT, name: 'Nouveau nom commercial', slug: 'coeur' });
    jest
      .mocked(adminClientsApi.resolveName)
      .mockResolvedValue({ data: [renamed], meta: { name_slug: 'coeur' } });
    renderWithQueryClient(<ClientNameCombobox {...PROPS} clients={[renamed]} />);
    await search('C\u0153ur');
    expect(await screen.findByRole('option', { name: renamed.name })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
  });

  it('ne propose aucune creation pendant une panne et permet de reessayer', async () => {
    jest.mocked(adminClientsApi.resolveName).mockRejectedValueOnce(new Error('Unavailable'));
    renderWithQueryClient(<ClientNameCombobox {...PROPS} />);
    const interaction = await search('Nouveau');
    expect(screen.getByRole('status')).toHaveTextContent(/V.rification/);
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Impossible de v.rifier/);
    expect(screen.queryByText(/Aucun client existant/)).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
    jest
      .mocked(adminClientsApi.resolveName)
      .mockResolvedValue({ data: [CLIENT], meta: { name_slug: 'nouveau' } });
    await interaction.click(screen.getByRole('button', { name: /R.essayer/ }));
    expect(
      await screen.findByRole('option', { name: /Cr.er le client.*Nouveau/ }),
    ).toBeInTheDocument();
  });

  it('attend le rafraichissement du cache invalide avant de proposer une creation', async () => {
    const existing = normalizeClient({ ...CLIENT, name: 'Coeur', slug: 'coeur' });
    let resolveRequest!: (value: Awaited<ReturnType<typeof adminClientsApi.resolveName>>) => void;
    jest.mocked(adminClientsApi.resolveName).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { queryClient } = renderWithQueryClient(
      <ClientNameCombobox {...PROPS} clients={[existing]} />,
    );
    queryClient.setQueryData(
      [...ADMIN_CLIENTS_QUERY_KEY, 'resolve-name', PROPS.tenantId, 'Coeur'],
      {
        slug: 'coeur',
        clients: [],
      },
    );
    await queryClient.invalidateQueries({ queryKey: ADMIN_CLIENTS_QUERY_KEY });

    const interaction = await search('Coeur');
    await waitFor(() =>
      expect(adminClientsApi.resolveName).toHaveBeenCalledWith('Coeur', PROPS.tenantId),
    );
    expect(screen.getByRole('status')).toHaveTextContent(/V.rification/);
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
    expect(onUseNewName).not.toHaveBeenCalled();

    await act(async () => resolveRequest({ data: [existing], meta: { name_slug: 'coeur' } }));
    await interaction.click(await screen.findByRole('option', { name: 'Coeur' }));
    expect(onSelectExisting).toHaveBeenCalledWith(existing);
    expect(onUseNewName).not.toHaveBeenCalled();
  });

  it('suspend les choix pendant un rafraichissement actif et apres son echec', async () => {
    jest.mocked(adminClientsApi.resolveName).mockResolvedValueOnce({
      data: [CLIENT],
      meta: { name_slug: 'b-b' },
    });
    const { queryClient } = renderWithQueryClient(<ClientNameCombobox {...PROPS} />);
    await search('B-B');
    expect(await screen.findByRole('option', { name: CLIENT.name })).toBeInTheDocument();

    let rejectRequest!: (error: Error) => void;
    jest.mocked(adminClientsApi.resolveName).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
    );
    await act(async () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_CLIENTS_QUERY_KEY });
    });
    await waitFor(() => expect(adminClientsApi.resolveName).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('status')).toHaveTextContent(/V.rification/);
    expect(screen.queryByRole('option', { name: CLIENT.name })).not.toBeInTheDocument();

    await act(async () => rejectRequest(new Error('Unavailable')));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Impossible de v.rifier/);
    expect(screen.queryByRole('option', { name: CLIENT.name })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
    expect(onSelectExisting).not.toHaveBeenCalled();
    expect(onUseNewName).not.toHaveBeenCalled();
  });

  it('ne propose pas de creation pour un nom refuse par le backend', async () => {
    jest
      .mocked(adminClientsApi.resolveName)
      .mockRejectedValue(Object.assign(new Error('Invalid'), { status: 422 }));
    renderWithQueryClient(<ClientNameCombobox {...PROPS} />);
    await search('!!!');
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce nom de client est invalide.');
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
  });

  it('ignore une resolution tardive de la saisie precedente', async () => {
    type Response = Awaited<ReturnType<typeof adminClientsApi.resolveName>>;
    let resolvePrevious!: (value: Response) => void;
    let resolveCurrent!: (value: Response) => void;
    jest
      .mocked(adminClientsApi.resolveName)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePrevious = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveCurrent = resolve;
        }),
      );
    renderWithQueryClient(<ClientNameCombobox {...PROPS} />);
    await search('Alpha');
    await waitFor(() =>
      expect(adminClientsApi.resolveName).toHaveBeenCalledWith('Alpha', 'tenant-a'),
    );
    fireEvent.change(screen.getByPlaceholderText(/Nom du client/), { target: { value: 'Beta' } });
    await waitFor(() =>
      expect(adminClientsApi.resolveName).toHaveBeenCalledWith('Beta', 'tenant-a'),
    );
    await act(async () => resolvePrevious({ data: [], meta: { name_slug: 'alpha' } }));
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
    await act(async () => resolveCurrent({ data: [], meta: { name_slug: 'beta' } }));
    expect(
      await screen.findByRole('option', { name: /Cr.er le client.*Beta/ }),
    ).toBeInTheDocument();
  });

  it('reste bloque si le backend ne fournit pas le slug canonique', async () => {
    jest
      .mocked(adminClientsApi.resolveName)
      .mockResolvedValue({ data: [] } as unknown as Awaited<
        ReturnType<typeof adminClientsApi.resolveName>
      >);
    renderWithQueryClient(<ClientNameCombobox {...PROPS} />);
    await search('Nouveau');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onUseNewName).not.toHaveBeenCalled();
    expect(screen.queryByRole('option', { name: /^Cr.er le client/ })).not.toBeInTheDocument();
  });

  it('ne traite pas le chargement du catalogue comme une liste vide', () => {
    renderWithQueryClient(<ClientNameCombobox {...PROPS} clients={[]} isLoading />);
    expect(screen.getByRole('combobox', { name: 'Client' })).toBeDisabled();
    expect(adminClientsApi.resolveName).not.toHaveBeenCalled();
  });
});
