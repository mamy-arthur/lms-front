'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseSectionsApi } from '@/shared/api/courses.api';
import { contentEntriesApi } from '@/shared/api/content-entries.api';
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
    }: {
      contentTypeId: string;
      data: Record<string, unknown>;
    }) => contentEntriesApi.create(sectionId, { content_type_id: contentTypeId, data }),
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

// ─── Re-export types for consumers ──────────────────────────────────────────

export type { ApiCourseSection, ApiContentEntry, ContentTypeResource };
