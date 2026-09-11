export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string | null;
}

export function normalizeClient(raw: Partial<Client>): Client {
  return {
    id: String(raw.id ?? ''),
    tenant_id: String(raw.tenant_id ?? ''),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    is_active: Boolean(raw.is_active ?? true),
    created_at: raw.created_at ?? null,
  };
}
