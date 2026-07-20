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

export type MediaCategory =
  'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'other';

export function getMediaCategory(mimeType: string): MediaCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/msword' || mimeType.includes('wordprocessingml')) return 'document';
  if (mimeType === 'application/vnd.ms-excel' || mimeType.includes('spreadsheetml'))
    return 'spreadsheet';
  if (mimeType === 'application/vnd.ms-powerpoint' || mimeType.includes('presentationml'))
    return 'presentation';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function isPreviewable(mimeType: string): boolean {
  const c = getMediaCategory(mimeType);
  return c === 'image' || c === 'video' || c === 'pdf';
}

export function downloadFile(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
