'use client';

import { useCallback, useMemo, useState, useSyncExternalStore, type SetStateAction } from 'react';
import { Role } from '@/shared/constants/roles';

export interface UsersListParamsOptions {
  /** Opt-in: other users-table consumers keep their component-local state. */
  urlPath?: string;
  includeTenantFilter?: boolean;
  includeClientFilter?: boolean;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
}

export const USERS_LIST_URL_CHANGE = 'users-list-url-change';
const PARAM_KEYS = [
  'q',
  'roles',
  'is_active',
  'tenant_id',
  'client_id',
  'sort_by',
  'sort_dir',
  'page',
  'page_size',
] as const;

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(USERS_LIST_URL_CHANGE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(USERS_LIST_URL_CHANGE, onChange);
  };
}

const serverSnapshot = () => '';

// The URL exposes a 1-based page; the controller keeps a 0-based index.
function serialize(
  search: string,
  params: Record<string, unknown>,
  defaults: Record<string, unknown>,
) {
  const query = new URLSearchParams(search);
  for (const key of PARAM_KEYS) {
    let value = params[key];
    if (key === 'page') {
      const index = typeof value === 'number' ? value : 0;
      value = index > 0 ? index + 1 : undefined;
    }
    if (value === undefined || value === null || value === '' || value === defaults[key]) {
      query.delete(key);
    } else {
      query.set(key, String(value));
    }
  }
  return query.size ? `?${query}` : '';
}

export function useUsersListParams<TParams>({
  urlPath,
  includeTenantFilter = false,
  includeClientFilter = false,
  defaultSortBy = 'created_at',
  defaultSortDir = 'desc',
  defaultPageSize = 25,
}: UsersListParamsOptions) {
  type Params = TParams & Record<string, unknown>;
  const defaults = useMemo(
    () => ({
      sort_by: defaultSortBy,
      sort_dir: defaultSortDir,
      page_size: defaultPageSize,
      page: 0,
    }),
    [defaultSortBy, defaultSortDir, defaultPageSize],
  );

  const parse = useCallback(
    (search: string): Params => {
      const query = new URLSearchParams(search);
      const result: Record<string, unknown> = { ...defaults };
      const roles = [...new Set((query.get('roles') ?? '').split(','))].filter((role) =>
        Object.values(Role).includes(role as Role),
      );
      if (roles.length) result.roles = roles.join(',');
      if (query.get('q')) result.q = query.get('q');
      if (query.get('is_active') === 'true') result.is_active = true;
      if (query.get('is_active') === 'false') result.is_active = false;
      if (includeTenantFilter && query.get('tenant_id')) result.tenant_id = query.get('tenant_id');
      if (includeClientFilter && query.get('client_id')) result.client_id = query.get('client_id');
      const sortBy = query.get('sort_by');
      if (sortBy && ['name', 'email', 'is_active', 'created_at', defaultSortBy].includes(sortBy)) {
        result.sort_by = sortBy;
      }
      const sortDir = query.get('sort_dir');
      if (sortDir === 'asc' || sortDir === 'desc') result.sort_dir = sortDir;
      const page = query.get('page') ?? '';
      if (/^\d+$/.test(page) && Number.isSafeInteger(Number(page)) && Number(page) > 1) {
        result.page = Number(page) - 1;
      }
      const pageSize = Number(query.get('page_size'));
      if ([25, 50, 100, defaultPageSize].includes(pageSize)) result.page_size = pageSize;
      return result as Params;
    },
    [defaults, defaultSortBy, defaultPageSize, includeTenantFilter, includeClientFilter],
  );

  const getSnapshot = useCallback(
    () => (urlPath && window.location.pathname === urlPath ? window.location.search : ''),
    [urlPath],
  );
  const search = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const [localParams, setLocalParams] = useState<Params>(() => parse(''));
  const params = useMemo(
    () => (urlPath ? parse(search) : localParams),
    [urlPath, parse, search, localParams],
  );

  const setParams = useCallback(
    (action: SetStateAction<Params>) => {
      if (!urlPath) {
        setLocalParams(action);
        return;
      }
      // Read the current URL for every update, including consecutive functional updates.
      const currentSearch = getSnapshot();
      const previous = parse(currentSearch);
      const next = typeof action === 'function' ? action(previous) : action;
      if (next === previous) return;
      const href = `${urlPath}${serialize(currentSearch, next, defaults)}${window.location.hash}`;
      // Next integrates native History calls without adding a history entry per filter change.
      window.history.replaceState(null, '', href);
      window.dispatchEvent(new Event(USERS_LIST_URL_CHANGE));
    },
    [urlPath, getSnapshot, parse, defaults],
  );

  return { params, setParams };
}
