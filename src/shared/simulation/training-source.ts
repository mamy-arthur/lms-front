import type { ResourceName, SimulationData, SimulationEntity } from './fixtures';
import type { ApiScormLaunch } from '@/shared/api/portal-scorm.api';
import { getScormPreviewLaunchUrl } from '@/modules/portal/resources/formation-learning/lib/scormPreviewRuntime';
import {
  createTrainingPreview,
  importTrainingPreview,
  type TrainingPreview,
} from './training-data';

export type TrainingReader = <T>(path: string, params?: Record<string, unknown>) => Promise<T>;

const BASE = 'role-simulation/training/learning-paths';

/** Load authorized content, never real enrollments/results. All writes remain in local-api. */
export function createTrainingSource(
  data: SimulationData,
  read: TrainingReader,
  isCurrent: () => boolean,
) {
  let preview: TrainingPreview | null = null;
  let catalog: Promise<void> | null = null;
  const details = new Map<string, Promise<void>>();
  const assertCurrent = () => {
    if (!isCurrent()) throw new DOMException('Changement de contexte de simulation', 'AbortError');
  };

  async function loadCatalog() {
    const paths: SimulationEntity[] = [];
    let page = 1;
    let lastPage: number;
    do {
      const result = await read<{
        data: SimulationEntity[];
        meta: { current_page: number; last_page: number };
      }>(BASE, { page, per_page: 100 });
      assertCurrent();
      if (
        !Array.isArray(result.data) ||
        result.meta?.current_page !== page ||
        !Number.isInteger(result.meta.last_page) ||
        result.meta.last_page < page
      ) {
        throw new Error('Impossible de charger les formations en simulation. Réessayez.');
      }
      paths.push(...result.data);
      lastPage = result.meta.last_page;
      page++;
    } while (page <= lastPage);
    preview = createTrainingPreview(data, paths);
  }

  return {
    isReadOnlyScorm(entryId: string): boolean {
      return preview?.scormEntries.has(entryId) ?? false;
    },
    async launchScorm(enrollmentId: string, entryId: string, signal?: AbortSignal | null) {
      assertCurrent();
      const real = preview?.scormEntries.get(entryId);
      if (!real || preview?.enrollmentPaths.get(enrollmentId) !== real.pathId)
        throw new Error('Contenu SCORM absent de cette formation.');
      const { data: launch } = await read<{ data: ApiScormLaunch }>(
        `${BASE}/${real.pathId}/entries/${real.entryId}/scorm/launch`,
      );
      assertCurrent();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const url = getScormPreviewLaunchUrl(launch.launch_url, window.location.origin);
      if (
        !url ||
        launch.read_only !== true ||
        !['1.2', '2004'].includes(launch.version) ||
        launch.content_entry_id !== real.entryId ||
        launch.scorm_package_id !== real.packageId ||
        !new URL(url, window.location.origin).pathname.startsWith(
          `/api/v1/${BASE}/${real.pathId}/entries/${real.entryId}/scorm/assets/`,
        )
      )
        throw new Error('Lancement SCORM de simulation invalide.');
      return launch;
    },
    async prepare(path: string, signal?: AbortSignal | null): Promise<void> {
      if (
        !/^(?:me\/enrollments$|my-learning-paths$|enrollments(?:\/|$)|(?:platform\/)?users\/[^/]+\/(?:enrollments|purchased-learning-paths)$|platform\/learning-path-categories(?:\/|$))/.test(
          path,
        )
      )
        return;
      assertCurrent();
      if (!preview) {
        catalog ??= loadCatalog().finally(() => {
          catalog = null;
        });
        await catalog;
      }
      assertCurrent();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const enrollmentId = /^enrollments\/([^/]+)/.exec(path)?.[1];
      const realPathId = enrollmentId ? preview?.enrollmentPaths.get(enrollmentId) : undefined;
      if (!realPathId || preview!.loadedPaths.has(realPathId)) return;
      let pending = details.get(realPathId);
      if (!pending) {
        pending = (async () => {
          const result = await read<{
            data: { resources: Partial<Record<ResourceName, SimulationEntity[]>> };
          }>(`${BASE}/${realPathId}`);
          assertCurrent();
          importTrainingPreview(data, preview!, realPathId, result.data.resources);
        })().finally(() => {
          details.delete(realPathId);
        });
        details.set(realPathId, pending);
      }
      await pending;
      assertCurrent();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    },
  };
}
