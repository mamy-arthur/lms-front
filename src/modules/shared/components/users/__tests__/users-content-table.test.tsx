import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersContentTable } from '../users-content-table';
import { AdminUsersTable } from '@/modules/admin/resources/users/pages/_components/admin-users-table';
import { ClientUsersTable } from '@/modules/portal/resources/users/pages/_components/client-users-table';
import { normalizeUser } from '@/modules/admin/resources/users/types';

const trainee = normalizeUser({
  id: 'trainee-1',
  first_name: 'Alice',
  last_name: 'Dupont',
  email: 'alice@example.test',
});

describe.each([
  ['partagé', UsersContentTable],
  ['admin', AdminUsersTable],
  ['portail', ClientUsersTable],
] as const)('Tableau utilisateurs %s', (_name, Table) => {
  function setup() {
    const onRowClick = jest.fn();
    const onView = jest.fn();
    const onEdit = jest.fn();
    render(
      <Table
        users={[trainee]}
        page={0}
        pageSize={25}
        total={1}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
        onRowClick={onRowClick}
        onView={onView}
        onEdit={onEdit}
        onToggleActive={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    return { onRowClick, onView, onEdit, interaction: userEvent.setup() };
  }

  it('utilise le handler explicite pour le clic de ligne', async () => {
    const { onRowClick, onEdit, interaction } = setup();
    await interaction.click(screen.getByText('alice@example.test'));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(trainee);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it.each(['{Enter}', ' '])(
    'ouvre une ligne au clavier avec %s sans double déclenchement',
    async (key) => {
      const { onRowClick, interaction } = setup();
      screen.getByRole('button', { name: 'Ouvrir Alice Dupont' }).focus();
      await interaction.keyboard(key);
      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith(trainee);
    },
  );

  it('isole Modifier et Voir du clic de ligne', async () => {
    const { onRowClick, onView, onEdit, interaction } = setup();
    await interaction.click(screen.getByRole('button', { name: 'Actions pour Alice Dupont' }));
    await interaction.click(screen.getByRole('menuitem', { name: 'Modifier' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(trainee);
    expect(onRowClick).not.toHaveBeenCalled();
    await interaction.click(screen.getByRole('button', { name: 'Actions pour Alice Dupont' }));
    await interaction.click(screen.getByRole('menuitem', { name: 'Voir le détail' }));
    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(trainee);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});

it('préserve la priorité historique de l’édition pour les autres consommateurs', async () => {
  const onEdit = jest.fn();
  const onView = jest.fn();
  render(
    <UsersContentTable
      users={[trainee]}
      page={0}
      pageSize={25}
      total={1}
      onPageChange={jest.fn()}
      onPageSizeChange={jest.fn()}
      onView={onView}
      onEdit={onEdit}
    />,
  );
  await userEvent.click(screen.getByText('alice@example.test'));
  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onEdit).toHaveBeenCalledWith(trainee);
  expect(onView).not.toHaveBeenCalled();
});
