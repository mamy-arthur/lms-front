import {
  List,
  Datagrid,
  TextField,
  EmailField,
  BooleanField,
  DateField,
  SearchInput,
  TopToolbar,
  CreateButton,
  ExportButton,
} from "react-admin";

const filters = [<SearchInput key="q" source="q" alwaysOn />];

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export function UsersList() {
  return (
    <List filters={filters} actions={<ListActions />} perPage={25}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Nom" />
        <EmailField source="email" label="Email" />
        <TextField source="role" label="Rôle" />
        <BooleanField source="isActive" label="Actif" />
        <DateField source="createdAt" label="Créé le" />
      </Datagrid>
    </List>
  );
}
