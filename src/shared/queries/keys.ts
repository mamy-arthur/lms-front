export const tenantKeys = {
  all: ['tenant'] as const,
  current: () => [...tenantKeys.all, 'current'] as const,
};

export const platformTenantKeys = {
  all: ['platform', 'tenants'] as const,
  lists: () => [...platformTenantKeys.all, 'list'] as const,
  list: (filters: object) => [...platformTenantKeys.lists(), filters] as const,
  detail: (id: string) => [...platformTenantKeys.all, 'detail', id] as const,
};

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: object) => [...userKeys.lists(), filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: object) => [...courseKeys.lists(), filters] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
};

export const courseCategoryKeys = {
  all: ['course-categories'] as const,
  lists: () => [...courseCategoryKeys.all, 'list'] as const,
  detail: (id: string) => [...courseCategoryKeys.all, 'detail', id] as const,
};

export const courseSectionKeys = {
  all: ['course-sections'] as const,
  list: (courseId: string) => [...courseSectionKeys.all, 'list', courseId] as const,
  detail: (courseId: string, sectionId: string) =>
    [...courseSectionKeys.all, 'detail', courseId, sectionId] as const,
};

export const contentEntryKeys = {
  all: ['content-entries'] as const,
  list: (sectionId: string) => [...contentEntryKeys.all, 'list', sectionId] as const,
  detail: (id: string) => [...contentEntryKeys.all, 'detail', id] as const,
};

export const contentTypeKeys = {
  all: ['content-types'] as const,
  lists: () => [...contentTypeKeys.all, 'list'] as const,
  detail: (id: string) => [...contentTypeKeys.all, 'detail', id] as const,
};

export const learningPathCategoryKeys = {
  all: ['learning-path-categories'] as const,
  lists: () => [...learningPathCategoryKeys.all, 'list'] as const,
  detail: (id: string) => [...learningPathCategoryKeys.all, 'detail', id] as const,
};

export const learningPathKeys = {
  all: ['learning-paths'] as const,
  lists: () => [...learningPathKeys.all, 'list'] as const,
  detail: (id: string) => [...learningPathKeys.all, 'detail', id] as const,
};

export const shopLearningPathKeys = {
  all: ['shop-learning-paths'] as const,
  lists: () => [...shopLearningPathKeys.all, 'list'] as const,
  list: (filters: object) => [...shopLearningPathKeys.lists(), filters] as const,
  detail: (id: string) => [...shopLearningPathKeys.all, 'detail', id] as const,
};

export const cartKeys = {
  all: ['carts'] as const,
  active: () => [...cartKeys.all, 'active'] as const,
};

export const learningPathCompetencyAssociationKeys = {
  all: ['learning-path-competency-associations'] as const,
  lists: () => [...learningPathCompetencyAssociationKeys.all, 'list'] as const,
};

export const questionBankKeys = {
  all: ['question-banks'] as const,
  lists: () => [...questionBankKeys.all, 'list'] as const,
  list: (filters: object) => [...questionBankKeys.lists(), filters] as const,
  detail: (id: string) => [...questionBankKeys.all, 'detail', id] as const,
};

export const quizItemKeys = {
  all: ['quiz-items'] as const,
  lists: () => [...quizItemKeys.all, 'list'] as const,
  listByBank: (bankId: string, filters?: object) =>
    [...quizItemKeys.lists(), bankId, filters ?? {}] as const,
  detail: (id: string) => [...quizItemKeys.all, 'detail', id] as const,
};

export const evaluationKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationKeys.all, 'list'] as const,
  listByLearningPath: (learningPathId: string) =>
    [...evaluationKeys.lists(), learningPathId] as const,
  detail: (id: string) => [...evaluationKeys.all, 'detail', id] as const,
};

export const progressionRuleKeys = {
  all: ['progression-rules'] as const,
  listByLearningPath: (learningPathId: string) =>
    [...progressionRuleKeys.all, 'list', learningPathId] as const,
};
