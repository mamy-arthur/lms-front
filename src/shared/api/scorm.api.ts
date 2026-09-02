import { apiGet, apiPost, apiUploadWithProgress } from '@/shared/lib/apiClient';
import type { ApiContentEntry } from '@/shared/types/course.types';

export type ScormPackageStatus = 'pending' | 'extracting' | 'extracted' | 'ready' | 'failed';
export type ScormVersion = '1.2' | '2004';

export interface ApiScormPackage {
  id: string;
  content_entry_id: string | null;
  status: ScormPackageStatus;
  title: string | null;
  version: ScormVersion | null;
  launch_path: string | null;
  failure_reason: string | null;
  original_filename: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export const scormApi = {
  upload: (
    file: File,
    onProgress: (percent: number) => void,
  ): Promise<{ data: ApiScormPackage }> => {
    const form = new FormData();
    form.append('file', file);
    return apiUploadWithProgress<{ data: ApiScormPackage }>(
      'platform/scorm-packages',
      form,
      onProgress,
    );
  },

  get: (id: string): Promise<{ data: ApiScormPackage }> =>
    apiGet<{ data: ApiScormPackage }>(`platform/scorm-packages/${id}`),

  attachToEntry: (entryId: string, scormPackageId: string): Promise<{ data: ApiContentEntry }> =>
    apiPost<{ data: ApiContentEntry }>(`platform/entries/${entryId}/scorm-package`, {
      scorm_package_id: scormPackageId,
    }),
};
