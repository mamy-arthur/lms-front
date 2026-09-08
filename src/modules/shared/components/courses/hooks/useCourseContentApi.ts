'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseSectionsApi } from '@/shared/api/courses.api';
import { contentEntriesApi } from '@/shared/api/content-entries.api';
import { scormApi } from '@/shared/api/scorm.api';
import { courseSectionKeys, contentEntryKeys } from '@/shared/queries/keys';
import type { ApiCourseSection, ApiContentEntry } from '@/shared/types/course.types';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

// ─── Sections ────────────────────────────────────────────────────────────────

export function useSections(courseId: string) {
  return useQuery({
    queryKey: courseSectionKeys.list(courseId),
    queryFn: () => courseSectionsApi.list(courseId).then((r) => r.data),
    enabled: !!courseId,
  });
}

export function useAddSection(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => courseSectionsApi.create(courseId, { name }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<ApiCourseSection[]>(courseSectionKeys.list(courseId), (prev = []) =>
        [...prev, data].sort((a, b) => a.rank - b.rank),
      );
    },
  });
}

export function useUpdateSection(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, name }: { sectionId: string; name: string }) =>
      courseSectionsApi.update(courseId, sectionId, { name }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<ApiCourseSection[]>(courseSectionKeys.list(courseId), (prev = []) =>
        prev.map((s) => (s.id === data.id ? data : s)),
      );
    },
  });
}

export function useRemoveSection(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => courseSectionsApi.remove(courseId, sectionId),
    onSuccess: (_, sectionId) => {
      queryClient.setQueryData<ApiCourseSection[]>(courseSectionKeys.list(courseId), (prev = []) =>
        prev.filter((s) => s.id !== sectionId),
      );
    },
  });
}

export function useReorderSections(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionIds: string[]) => courseSectionsApi.reorder(courseId, sectionIds),
    onSuccess: (_, sectionIds) => {
      queryClient.setQueryData<ApiCourseSection[]>(
        courseSectionKeys.list(courseId),
        (prev = []) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          return sectionIds.map((id, i) => ({ ...map.get(id)!, rank: i }));
        },
      );
    },
  });
}

// ─── Content entries ──────────────────────────────────────────────────────────

export function useEntries(sectionId: string) {
  return useQuery({
    queryKey: contentEntryKeys.list(sectionId),
    queryFn: () => contentEntriesApi.list(sectionId).then((r) => r.data),
    enabled: !!sectionId,
  });
}

export function useAddEntry(sectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentTypeId,
      data,
      scormPackageId,
    }: {
      contentTypeId: string;
      data: Record<string, unknown>;
      scormPackageId?: string;
    }) =>
      contentEntriesApi.create(sectionId, {
        content_type_id: contentTypeId,
        data,
        ...(scormPackageId ? { scorm_package_id: scormPackageId } : {}),
      }),
    onSuccess: ({ data: entry }) => {
      queryClient.setQueryData<ApiContentEntry[]>(contentEntryKeys.list(sectionId), (prev = []) => [
        ...prev,
        entry,
      ]);
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      data,
      isPublished,
    }: {
      entryId: string;
      sectionId: string;
      data?: Record<string, unknown>;
      isPublished?: boolean;
    }) =>
      contentEntriesApi.update(entryId, {
        ...(data !== undefined ? { data } : {}),
        ...(isPublished !== undefined ? { is_published: isPublished } : {}),
      }),
    onSuccess: ({ data: entry }, { sectionId }) => {
      queryClient.setQueryData<ApiContentEntry[]>(contentEntryKeys.list(sectionId), (prev = []) =>
        prev.map((e) => (e.id === entry.id ? entry : e)),
      );
    },
  });
}

/**
 * Reorders an entry within its section.
 *
 * Optimistic: the list is rewritten before the request leaves, so the drop lands
 * instantly instead of snapping back for the duration of the round-trip. The
 * pre-drag list is snapshotted and restored verbatim if the API rejects the move.
 *
 * `position` is the target 0-based index in the section *after* the move, which is
 * exactly what arrayMove() reports — see MoveContentEntryRequest on the backend.
 */
export function useMoveEntry(sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entryId,
      position,
    }: {
      entryId: string;
      orderedIds: string[];
      position: number;
    }) => contentEntriesApi.move(entryId, { course_section_id: sectionId, position }),

    onMutate: async ({ orderedIds }) => {
      // Stop any list refetch in flight from overwriting the optimistic order.
      await queryClient.cancelQueries({ queryKey: contentEntryKeys.list(sectionId) });

      const previous = queryClient.getQueryData<ApiContentEntry[]>(
        contentEntryKeys.list(sectionId),
      );

      queryClient.setQueryData<ApiContentEntry[]>(contentEntryKeys.list(sectionId), (prev = []) => {
        const byId = new Map(prev.map((e) => [e.id, e]));

        return orderedIds.flatMap((id, index) => {
          const entry = byId.get(id);
          return entry ? [{ ...entry, rank: index }] : [];
        });
      });

      return { previous };
    },

    onError: (_error, _variables, context) => {
      // Restore the exact list captured before the drag, including its ranks.
      if (context?.previous) {
        queryClient.setQueryData(contentEntryKeys.list(sectionId), context.previous);
      }
    },

    // The server renumbers the whole section, so resync rather than trusting the
    // optimistic ranks — this also covers a move that succeeded only partially.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: contentEntryKeys.list(sectionId) });
    },
  });
}

export function useRemoveEntry(sectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => contentEntriesApi.remove(entryId),
    onSuccess: (_, entryId) => {
      queryClient.setQueryData<ApiContentEntry[]>(contentEntryKeys.list(sectionId), (prev = []) =>
        prev.filter((e) => e.id !== entryId),
      );
    },
  });
}

// ─── Scorm package attachment ────────────────────────────────────────────────

export function useAttachScormPackage(sectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, scormPackageId }: { entryId: string; scormPackageId: string }) =>
      scormApi.attachToEntry(entryId, scormPackageId),
    onSuccess: ({ data: entry }) => {
      queryClient.setQueryData<ApiContentEntry[]>(contentEntryKeys.list(sectionId), (prev = []) =>
        prev.map((e) => (e.id === entry.id ? entry : e)),
      );
    },
  });
}

// ─── Re-export types for consumers ──────────────────────────────────────────

export type { ApiCourseSection, ApiContentEntry, ContentTypeResource };
