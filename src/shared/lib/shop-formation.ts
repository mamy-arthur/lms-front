import type {
  ApiShopLearningPath,
  ApiShopCompetency,
  ApiLearningPathEvaluation,
} from '@/shared/types/learning-path.types';
import type { StoreFormationDetails, StoreProgramStep } from '@/shared/mocks/store.mock';
import { formatDuration, formatValidityDuration } from './duration';

/**
 * Builds the ordered programme: competency → its PARTIAL evals → next competency → FINAL evals.
 */
export function buildProgramSteps(
  competencies: ApiShopCompetency[],
  evaluations: ApiLearningPathEvaluation[] = [],
): StoreProgramStep[] {
  const partialByAnchor = new Map<string, ApiLearningPathEvaluation[]>();
  const finals: ApiLearningPathEvaluation[] = [];

  for (const e of evaluations) {
    if (e.preceding_competency_id !== null) {
      const group = partialByAnchor.get(e.preceding_competency_id) ?? [];
      group.push(e);
      partialByAnchor.set(e.preceding_competency_id, group);
    } else {
      finals.push(e);
    }
  }

  const steps: StoreProgramStep[] = [];

  for (const c of [...competencies].sort((a, b) => a.position - b.position)) {
    steps.push({
      id: c.competency_id,
      type: 'module',
      title: c.shortname,
      lessons: [...c.courses].sort((a, b) => a.position - b.position).map((co) => co.full_name),
    });

    for (const e of (partialByAnchor.get(c.competency_id) ?? []).sort(
      (a, b) => a.position - b.position,
    )) {
      steps.push({ id: e.id, type: 'evaluation', title: e.title });
    }
  }

  for (const e of [...finals].sort((a, b) => a.position - b.position)) {
    steps.push({ id: e.id, type: 'evaluation', title: e.title });
  }

  return steps;
}

/**
 * Maps an ApiShopLearningPath to StoreFormationDetails.
 * Pass `categoryName` if you need a human-readable category label.
 */
export function toShopFormationDetails(
  lp: ApiShopLearningPath,
  categoryName = '',
): StoreFormationDetails {
  const programSteps = buildProgramSteps(lp.competencies, lp.evaluations ?? []);
  const moduleCount = programSteps.filter((s) => s.type === 'module').length;
  const evaluationCount = programSteps.filter((s) => s.type === 'evaluation').length;

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
    moduleCount,
    evaluationCount,
    shortDescription: lp.description ?? '',
    fullDescription: lp.description ?? '',
    level: 'Débutant',
    duration: formatDuration(lp.duration ?? 0),
    validity: lp.validity !== null ? formatValidityDuration(lp.validity) : null,
    language: 'Français',
    certificate: lp.has_certificate,
    learningObjectives: [],
    programSteps,
    courseCount: programSteps.reduce(
      (acc, s) => acc + (s.type === 'module' ? s.lessons.length : 0),
      0,
    ),
  };
}
