export type BackendModuleType = 'page' | 'file' | 'folder' | 'url' | 'media' | 'scorm';

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
  field_id: string;
  type: FieldType;
  name: string;
  label: string;
  required: boolean;
  is_archived: boolean;
  accept: string[];
  max_size_mb: number | null;
  multiple: boolean;
}

export interface ContentTypeResource {
  id: string;
  module_type: BackendModuleType;
  title: string;
  description: string | null;
  is_active: boolean;
  version: number;
  fields: ContentTypeField[];
  created_at: string;
  updated_at: string;
}
