export type ModuleType = 'page' | 'file' | 'folder' | 'url' | 'media' | 'scorm';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'media'
  | 'relation';

export interface ContentTypeField {
  id?: string;
  type: FieldType;
  name: string;
  label: string;
  required: boolean;
  is_archived: boolean;
  // Media-specific options
  accept?: string[];
  max_size_mb?: number;
  multiple?: boolean;
}

export interface ContentType {
  id: string;
  module_type: ModuleType;
  title: string;
  description?: string;
  version?: number;
  status?: 'active' | 'draft';
  fields: ContentTypeField[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateContentTypePayload {
  module_type: ModuleType;
  title: string;
  description?: string;
  fields: Omit<ContentTypeField, 'id'>[];
}

export type UpdateContentTypePayload = Partial<CreateContentTypePayload>;

export const MODULE_TYPES: { value: ModuleType; label: string }[] = [
  { value: 'page', label: 'Page' },
  { value: 'file', label: 'Fichier' },
  { value: 'folder', label: 'Dossier' },
  { value: 'url', label: 'URL' },
  { value: 'media', label: 'Média' },
  { value: 'scorm', label: 'SCORM' },
];

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'richtext', label: 'Texte riche' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Sélection' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'media', label: 'Média' },
  { value: 'relation', label: 'Relation' },
];
