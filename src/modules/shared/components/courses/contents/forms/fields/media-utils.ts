export function isMediaObject(v: unknown): v is { id: string } {
  return !!v && typeof v === 'object' && 'id' in v;
}

export function extractMediaId(v: unknown): string | null {
  if (typeof v === 'string' && v) return v;
  if (isMediaObject(v)) return v.id;
  return null;
}

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.json === 'object' && e.json !== null) {
      const j = e.json as Record<string, unknown>;
      if (typeof j.message === 'string') return j.message;
    }
    if (typeof e.message === 'string') return e.message;
  }
  return "Échec de l'upload";
}
