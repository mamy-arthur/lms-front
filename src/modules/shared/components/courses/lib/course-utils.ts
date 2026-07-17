import type { Category } from '../types/index';

export function buildCategoryTree(categories: Category[]) {
  const byParent = new Map<string | null, Category[]>();
  for (const c of categories) {
    const arr = byParent.get(c.parentId) ?? [];
    arr.push(c);
    byParent.set(c.parentId, arr);
  }
  const result: { category: Category; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const child of children) {
      result.push({ category: child, depth });
      walk(child.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

export function getCategoryPath(categories: Category[], id: string | null): string {
  if (!id) return '—';
  const map = new Map(categories.map((c) => [c.id, c] as const));
  const parts: string[] = [];
  let cur = map.get(id);
  let guard = 0;
  while (cur && guard++ < 20) {
    parts.unshift(cur.name);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return parts.join(' / ');
}
