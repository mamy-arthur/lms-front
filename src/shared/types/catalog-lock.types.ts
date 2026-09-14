/**
 * Catalogue sale lock — the backend freezes the structure of anything that sits,
 * through any path, inside a learning path that has been sold.
 *
 * A course shared between several modules is locked as soon as ONE of its parent
 * modules is frozen, so the origins matter: a user who reached the course through
 * a free module has no other way to understand why the controls are greyed out.
 */

export interface ApiCatalogLockOrigin {
  competency_id: string;
  competency_name: string;
  learning_path_id: string;
  learning_path_name: string;
}

/** Shape appended by the backend to module list rows and course detail payloads. */
export interface ApiCatalogLock {
  is_locked?: boolean;
  lock_origins?: ApiCatalogLockOrigin[];
}

export interface CatalogLock {
  isLocked: boolean;
  origins: ApiCatalogLockOrigin[];
}

export const CATALOG_LOCK_UNLOCKED: CatalogLock = { isLocked: false, origins: [] };

/** Error codes carried by the 409 responses (`error_code`). */
export const CATALOG_LOCK_ERROR_CODES = [
  'catalog_lock.competency',
  'catalog_lock.course',
  'catalog_lock.course_section',
  'catalog_lock.content_entry',
] as const;

export function normalizeCatalogLock(raw: ApiCatalogLock | undefined | null): CatalogLock {
  return {
    isLocked: raw?.is_locked ?? false,
    origins: raw?.lock_origins ?? [],
  };
}

/** Short label for a module drawer, where the module in question is already on screen. */
export const MODULE_LOCKED_LABEL = 'Module lié à une formation vendue';

/**
 * Names the module and learning path responsible. Several origins are summarised
 * rather than listed in full — the first one is enough to explain the block, and a
 * tooltip is the wrong place for an exhaustive list.
 */
export function describeLockOrigins(origins: ApiCatalogLockOrigin[]): string {
  if (origins.length === 0) return 'Cet élément est lié à une formation vendue.';

  const [first] = origins;
  const base = `Module « ${first.competency_name} » dans la formation « ${first.learning_path_name} ».`;

  if (origins.length === 1) return base;

  const others = origins.length - 1;
  return `${base} Et ${others} autre${others > 1 ? 's' : ''} formation${others > 1 ? 's' : ''}.`;
}

/** Full sentence for a locked course control: what is blocked, then why. */
export function describeCourseLock(origins: ApiCatalogLockOrigin[]): string {
  return `Ce cours appartient à un module lié à une formation vendue : sa structure ne peut plus être modifiée. ${describeLockOrigins(
    origins,
  )}`;
}

function errorJson(err: unknown): Record<string, unknown> | null {
  if (!err || typeof err !== 'object') return null;
  const json = (err as Record<string, unknown>).json;
  return json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
}

export function isCatalogLockError(err: unknown): boolean {
  const code = errorJson(err)?.error_code;
  return typeof code === 'string' && (CATALOG_LOCK_ERROR_CODES as readonly string[]).includes(code);
}

/** Origins carried by a 409 refusal, so a late sale can be explained as precisely as an anticipated one. */
export function extractLockOrigins(err: unknown): ApiCatalogLockOrigin[] {
  const origins = errorJson(err)?.origins;
  return Array.isArray(origins) ? (origins as ApiCatalogLockOrigin[]) : [];
}
