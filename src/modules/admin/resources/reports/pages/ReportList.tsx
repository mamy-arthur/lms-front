import { List, Datagrid, TextField, DateField } from "react-admin";

export function ReportList() {
  return (
    <List perPage={25}>
      <Datagrid bulkActionButtons={false}>
        <TextField source="title" label="Titre" />
        <TextField source="type" label="Type" />
        <DateField source="createdAt" label="Créé le" />
      </Datagrid>
    </List>
  );
}
