import {
  List,
  Datagrid,
  TextField,
  SearchInput,
  TopToolbar,
  CreateButton,
} from "react-admin";

const filters = [<SearchInput key="q" source="q" alwaysOn />];

export function TenantList() {
  return (
    <List
      filters={filters}
      actions={
        <TopToolbar>
          <CreateButton />
        </TopToolbar>
      }
      perPage={25}
    >
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Nom" />
        <TextField source="slug" label="Slug" />
        <TextField source="domain" label="Domaine" />
      </Datagrid>
    </List>
  );
}
