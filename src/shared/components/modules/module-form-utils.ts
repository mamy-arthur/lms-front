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
