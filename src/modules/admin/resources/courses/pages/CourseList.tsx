import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  SearchInput,
  TopToolbar,
  CreateButton,
  ExportButton,
  Show,
  SimpleShowLayout,
} from "react-admin";

const filters = [<SearchInput key="q" source="q" alwaysOn />];

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export function CourseList() {
  return (
    <List filters={filters} actions={<ListActions />} perPage={25}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="title" label="Titre" />
        <TextField source="slug" label="Slug" />
        <BooleanField source="isPublished" label="Publié" />
        <DateField source="createdAt" label="Créé le" />
      </Datagrid>
    </List>
  );
}

export function CourseShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="title" label="Titre" />
        <TextField source="slug" label="Slug" />
        <TextField source="description" label="Description" />
        <BooleanField source="isPublished" label="Publié" />
        <DateField source="createdAt" label="Créé le" />
      </SimpleShowLayout>
    </Show>
  );
}
