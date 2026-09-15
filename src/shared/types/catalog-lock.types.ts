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

/** « 1 autre formation » / « 3 autres formations ». */
function plural(count: number, noun: string): string {
  const s = count > 1 ? 's' : '';
  return `${count} autre${s} ${noun}${s}`;
}

/**
 * Names the module and learning path responsible. Several origins are summarised
 * rather than listed in full — the first one is enough to explain the block, and a
 * tooltip is the wrong place for an exhaustive list.
 *
 * The remainder is counted by DISTINCT learning path, not by origin: an origin is a
 * (module, learning path) pair, so two locked modules inside a single sold path are
 * two origins but one formation. Counting origins would announce "1 autre formation"
 * where there is none. When every extra origin belongs to the path already named, the
 * remainder is described as other modules instead — which is what it actually is.
 */
export function describeLockOrigins(origins: ApiCatalogLockOrigin[]): string {
  if (origins.length === 0) return 'Cet élément est lié à une formation vendue.';

  const [first] = origins;
  const base = `Module « ${first.competency_name} » dans la formation « ${first.learning_path_name} ».`;

  if (origins.length === 1) return base;

  // Sets rather than `length - 1`: the same module can appear under several paths,
  // and the backend makes no promise that the pairs are free of duplicates.
  const otherPaths = new Set(origins.map((o) => o.learning_path_id)).size - 1;
  if (otherPaths > 0) return `${base} Et ${plural(otherPaths, 'formation')}.`;

  const otherModules = new Set(origins.map((o) => o.competency_id)).size - 1;
  if (otherModules > 0) return `${base} Et ${plural(otherModules, 'module')} dans cette formation.`;

  // Only duplicated pairs remain: nothing to add beyond the origin already named.
  return base;
}

/** Full sentence for a locked course control: what is blocked, then why. */
export function describeCourseLock(origins: ApiCatalogLockOrigin[]): string {
  return `Ce cours appartient à un module lié à une formation vendue : sa structure ne peut plus être modifiée. ${describeLockOrigins(
    origins,
  )}`;
}

/**
 * Caption for a locked course's action menu.
 *
 * Says what remains open as well as what closed: the backend refuses a course's
 * DELETE and any change of its `visibility`, but keeps renaming, re-describing and
 * re-categorising allowed. A caption that only listed the refusals would read as if
 * "Modifier" had been left enabled by mistake.
 */
export function describeCourseActionsLock(origins: ApiCatalogLockOrigin[]): string {
  return `${describeLockOrigins(
    origins,
  )} La suppression et la visibilité sont figées ; le renommage reste possible.`;
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
