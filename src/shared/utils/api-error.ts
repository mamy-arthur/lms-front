export function extractApiError(err: unknown, isEdit: boolean): string {
  if (err && typeof err === 'object') {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === 'object') {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg.length > 0) return msg;
    }
  }
  return isEdit
    ? 'Une erreur est survenue lors de la modification.'
    : 'Une erreur est survenue lors de la création.';
}
