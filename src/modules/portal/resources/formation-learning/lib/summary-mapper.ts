import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import type {
  Formation,
  FormationModule,
  FormationEvaluation,
  CourseSection,
  CourseContent,
} from './types';

/**
 * Maps the portal summary API response to the Formation type used by FormationPlayer.
 *
 * Mapping:
 *  ApiPortalSummaryModule  → FormationModule  (node)
 *  ApiPortalSummaryCourse  → CourseSection    (section inside module)
 *  ApiPortalSummaryEntry   → CourseContent    (content stub — data loaded lazily)
 *  module.evaluation       → FormationEvaluation (intermediate, inserted after its module)
 *  final_evaluation        → FormationEvaluation (final, appended at the end)
 */
export function mapSummaryToFormation(summary: ApiPortalLearningPathSummary): Formation {
  const nodes: (FormationModule | FormationEvaluation)[] = [];
  let order = 1;

  for (const mod of summary.modules) {
    const sections: CourseSection[] = mod.courses.map((course) => ({
      id: course.id,
      moduleId: mod.id,
      title: course.name,
      contents: course.content_entries.map((entry): CourseContent => ({
        id: entry.id,
        sectionId: course.id, // sectionId === courseId — used to call portal entry endpoint
        type: 'page', // placeholder; real type resolved when entry is fetched
        title: entry.title ?? '',
        status: 'available',
      })),
    }));

    nodes.push({
      id: mod.id,
      formationId: summary.id,
      type: 'module',
      title: mod.name,
      status: 'available',
      progress: 0,
      order: order++,
      sections,
    } satisfies FormationModule);

    if (mod.evaluation) {
      nodes.push({
        id: mod.evaluation.id,
        formationId: summary.id,
        type: 'evaluation',
        evaluationType: 'intermediate',
        title: mod.evaluation.title,
        status: 'available',
        order: order++,
        passingScore: 70,
        questions: [],
      } satisfies FormationEvaluation);
    }
  }

  if (summary.final_evaluation) {
    nodes.push({
      id: summary.final_evaluation.id,
      formationId: summary.id,
      type: 'evaluation',
      evaluationType: 'final',
      title: summary.final_evaluation.title,
      status: 'available',
      order: order,
      passingScore: 70,
      questions: [],
    } satisfies FormationEvaluation);
  }

  return {
    id: summary.id,
    slug: summary.id,
    title: summary.name,
    progress: 0,
    nodes,
  };
}
