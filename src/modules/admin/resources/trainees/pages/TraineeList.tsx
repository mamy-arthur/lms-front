import {
  List,
  Datagrid,
  TextField,
  EmailField,
  BooleanField,
  NumberField,
  SearchInput,
} from "react-admin";

const filters = [<SearchInput key="q" source="q" alwaysOn />];

export function TraineeList() {
  return (
    <List filters={filters} perPage={25}>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Nom" />
        <EmailField source="email" label="Email" />
        <NumberField source="enrolledCourses" label="Formations" />
        <BooleanField source="isActive" label="Actif" />
      </Datagrid>
    </List>
  );
}
