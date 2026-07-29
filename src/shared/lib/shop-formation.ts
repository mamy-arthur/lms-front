import type { ApiShopLearningPath, ApiShopCompetency } from '@/shared/types/learning-path.types';
import type { StoreFormationDetails, StoreProgramStep } from '@/shared/mocks/store.mock';
import { formatDuration } from './duration';

/**
 * Converts an array of enriched shop competencies into sorted StoreProgramStep[].
 * Competencies and their courses are sorted by position.
 */
export function buildProgramSteps(competencies: ApiShopCompetency[]): StoreProgramStep[] {
  return [...competencies]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      id: c.competency_id,
      type: 'module' as const,
      title: c.shortname,
      lessons: [...c.courses]
        .sort((a, b) => a.position - b.position)
        .map((course) => course.full_name),
    }));
}

/**
 * Maps an ApiShopLearningPath to StoreFormationDetails.
 * Pass `categoryName` if you need a human-readable category label.
 */
export function toShopFormationDetails(
  lp: ApiShopLearningPath,
  categoryName = '',
): StoreFormationDetails {
  const programSteps = buildProgramSteps(lp.competencies);

  return {
    id: lp.id,
    title: lp.name,
    author: '',
    category: categoryName,
    categoryId: lp.category_id ?? '',
    coverImage: lp.image?.url,
    price: lp.price ?? 0,
    updatedAt: lp.updated_at,
    enrolledCompanies: 0,
    moduleCount: programSteps.length,
    evaluationCount: 0,
    shortDescription: lp.description ?? '',
    fullDescription: lp.description ?? '',
    level: 'Débutant',
    duration: formatDuration(lp.duration ?? 0),
    language: 'Français',
    certificate: false,
    learningObjectives: [],
    programSteps,
    courseCount: programSteps.reduce(
      (acc, s) => acc + (s.type === 'module' ? s.lessons.length : 0),
      0,
    ),
  };
}
