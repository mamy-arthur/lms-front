export function extractApiError(err: unknown, isEdit: boolean): string {
  if (err && typeof err === "object") {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === "object") {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  return isEdit
    ? "Une erreur est survenue lors de la modification."
    : "Une erreur est survenue lors de la création.";
}

export function genIdentifier(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 20);
  const rand = Math.floor(100 + Math.random() * 900);
  return slug ? `${slug}-${rand}` : `MOD-${rand}`;
}

export function applyModuleParams<T extends { name: string; identifier: string; category: string; tenantId?: string }>(
  modules: T[],
  params?: {
    q?: string;
    category?: string;
    tenant_id?: string;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
    page?: number;
    page_size?: number;
  },
  defaultPageSize = 12,
): { data: T[]; total: number } {
  let data = [...modules];

  if (params?.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.identifier.toLowerCase().includes(q),
    );
  }
  if (params?.category) {
    data = data.filter((m) => m.category === params.category);
  }
  if (params?.tenant_id) {
    data = data.filter((m) => m.tenantId === params.tenant_id);
  }

  const col = params?.sort_by || "name";
  const dir = params?.sort_dir || "asc";
  data.sort((a, b) => {
    const aVal = String(a[col as keyof T] ?? "");
    const bVal = String(b[col as keyof T] ?? "");
    const cmp = aVal.localeCompare(bVal);
    return dir === "asc" ? cmp : -cmp;
  });

  const total = data.length;
  const page = params?.page ?? 0;
  const pageSize = params?.page_size ?? defaultPageSize;
  data = data.slice(page * pageSize, (page + 1) * pageSize);

  return { data, total };
}
