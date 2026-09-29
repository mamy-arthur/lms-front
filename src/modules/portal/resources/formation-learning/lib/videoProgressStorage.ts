import type { WatchedRange } from '@/shared/api/portal-video.api';

export interface VideoDraft {
  position: number;
  duration: number;
  ranges: WatchedRange[];
  version: number;
  pendingCommitId: string | null;
  updatedAt: number;
}
const STORAGE_KEY = 'learneo:video-progress:v1';
const MAX_AGE = 24 * 60 * 60 * 1000;

function valid(value: unknown): value is VideoDraft {
  if (!value || typeof value !== 'object') return false;
  const v = value as VideoDraft;
  return (
    Number.isFinite(v.position) &&
    v.position >= 0 &&
    v.position <= v.duration &&
    Number.isFinite(v.duration) &&
    v.duration > 0 &&
    v.duration <= 604800 &&
    Number.isInteger(v.version) &&
    v.version >= 0 &&
    (v.pendingCommitId === null || typeof v.pendingCommitId === 'string') &&
    Number.isFinite(v.updatedAt) &&
    v.updatedAt <= Date.now() &&
    Date.now() - v.updatedAt < MAX_AGE &&
    Array.isArray(v.ranges) &&
    v.ranges.length <= 512 &&
    v.ranges.every(
      (r) =>
        Array.isArray(r) &&
        r.length === 2 &&
        Number.isFinite(r[0]) &&
        Number.isFinite(r[1]) &&
        r[0] >= 0 &&
        r[1] > r[0] &&
        r[1] <= v.duration,
    )
  );
}

function read(): Record<string, VideoDraft> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, draft]) => valid(draft)));
  } catch {
    return {};
  }
}

/** Keys include tenant + learner + enrollment + node + visit + course + entry + media. */
export function readVideoDraft(key: string): VideoDraft | undefined {
  return read()[key];
}

export function writeVideoDraft(key: string, draft: VideoDraft): void {
  try {
    const entries = Object.entries({ ...read(), [key]: draft }).sort(
      (a, b) => a[1].updatedAt - b[1].updatedAt,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries.slice(-20))));
  } catch {
    /* Private browsing or quota: playback remains available. */
  }
}

export function clearVideoDraft(key: string, pendingCommitId: string | null): void {
  try {
    const entries = read();
    // An old acknowledgement must not remove a newer tab's pending save.
    if (entries[key]?.pendingCommitId !== pendingCommitId) return;
    delete entries[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* Best effort. */
  }
}
