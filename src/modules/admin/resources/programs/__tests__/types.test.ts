import { normalizeLearningPath } from '../types';
import type { ApiLearningPath } from '@/shared/types/learning-path.types';

function makeApiPath(overrides: Partial<ApiLearningPath> = {}): ApiLearningPath {
  return {
    id: 'lp-1',
    tenant_id: 'tenant-1',
    name: 'Formation test',
    description: null,
    idnumber: null,
    category_id: null,
    price: null,
    currency: null,
    image: null,
    published_at: null,
    author_id: null,
    show_in_shop: false,
    is_published: false,
    is_sellable: false,
    duration: null,
    competencies: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('normalizeLearningPath', () => {
  it('maps is_locked: true to isLocked: true', () => {
    const result = normalizeLearningPath(makeApiPath({ is_locked: true }));
    expect(result.isLocked).toBe(true);
  });

  it('maps is_locked: false to isLocked: false', () => {
    const result = normalizeLearningPath(makeApiPath({ is_locked: false }));
    expect(result.isLocked).toBe(false);
  });

  it('maps is_locked: undefined to isLocked: undefined', () => {
    const result = normalizeLearningPath(makeApiPath({ is_locked: undefined }));
    expect(result.isLocked).toBeUndefined();
  });
});
