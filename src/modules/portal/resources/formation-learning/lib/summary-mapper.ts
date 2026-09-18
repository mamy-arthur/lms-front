import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import type {
  Formation,
  FormationModule,
  FormationEvaluation,
  CourseSummary,
  CourseSection,
  CourseContent,
} from './types';

/**
 * Maps the portal summary API response to the Formation type used by FormationPlayer.
 *
 * Mapping:
 *  ApiPortalSummaryModule  → FormationModule  (node)
 *  ApiPortalSummaryCourse  → CourseSummary    (accordion item inside module)
 *  ApiPortalSummarySection → CourseSection    (section inside course)
 *  ApiPortalSummaryEntry   → CourseContent    (content stub — data loaded lazily)
 *  module.evaluation       → FormationEvaluation (intermediate, inserted after its module)
 *  final_evaluation        → FormationEvaluation (final, appended at the end)
 *
 * NOTE: CourseContent.courseId stores the course id (not the section id) because
 * the portal entry endpoint is scoped to /courses/{courseId}/entries/{entryId}.
 */
export function mapSummaryToFormation(summary: ApiPortalLearningPathSummary): Formation {
  const nodes: (FormationModule | FormationEvaluation)[] = [];
  let order = 1;
  let hasPendingContent = false;

  for (const mod of summary.modules) {
    const courses: CourseSummary[] = mod.courses.map((course) => ({
      id: course.id,
      title: course.name,
      sections: course.sections.map((section): CourseSection => ({
        id: section.id,
        moduleId: mod.id,
        title: section.name,
        contents: section.content_entries.map((entry): CourseContent => {
          // Keep the sequence across sections, courses and modules. Backend
          // module prerequisites still apply to the first unfinished content.
          const status = entry.completed
            ? 'completed'
            : !hasPendingContent && mod.accessible
              ? 'available'
              : 'locked';
          if (!entry.completed && !entry.read_only) hasPendingContent = true;

          return {
            // A shared course has an independent progression in each module.
            id: `${mod.id}:${course.id}:${entry.id}`,
            competencyId: mod.id,
            entryId: entry.id,
            courseId: course.id,
            type: 'page', // placeholder; real type resolved when entry is fetched
            title: entry.title ?? '',
            status,
            completed: entry.completed,
            ...(entry.read_only ? { readOnly: true } : {}),
          };
        }),
      })),
    }));

    const hasCompletedContent = courses.some((course) =>
      course.sections.some((section) => section.contents.some((content) => content.completed)),
    );

    nodes.push({
      id: mod.id,
      formationId: summary.id,
      type: 'module',
      title: mod.name,
      status: mod.accessible || hasCompletedContent ? 'available' : 'locked',
      progress: Math.round(mod.progress.percent),
      order: order++,
      courses,
    } satisfies FormationModule);

    if (mod.evaluation) {
      nodes.push({
        id: mod.evaluation.id,
        formationId: summary.id,
        type: 'evaluation',
        evaluationType: 'intermediate',
        title: mod.evaluation.title,
        status: mod.evaluation.accessible
          ? mod.evaluation.completed
            ? 'completed'
            : 'available'
          : 'locked',
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
      status: summary.final_evaluation.accessible
        ? summary.final_evaluation.completed
          ? 'completed'
          : 'available'
        : 'locked',
      order: order,
      passingScore: 70,
      questions: [],
    } satisfies FormationEvaluation);
  }

  return {
    id: summary.id,
    slug: summary.id,
    title: summary.name,
    progress: Math.round(summary.progress.percent),
    nodes,
  };
}
