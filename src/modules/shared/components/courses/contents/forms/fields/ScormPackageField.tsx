'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { scormApi, type ApiScormPackage } from '@/shared/api/scorm.api';
import { useAttachScormPackage } from '@/modules/shared/components/courses/hooks/useCourseContentApi';
import type { ApiContentEntry } from '@/shared/types/course.types';
import { extractErrorMessage } from './media-utils';

const POLL_INTERVAL_MS = 1500;

const PROCESSING_LABELS: Record<string, string> = {
  pending: 'En attente de traitement…',
  extracting: 'Extraction du package…',
  extracted: 'Analyse du manifeste…',
  ready: 'Rattachement au contenu…',
};

interface ScormPackageFieldProps {
  entry: ApiContentEntry;
}

/** Uploads a SCORM zip, polls until the backend has parsed its manifest, then attaches it to the entry. */
export function ScormPackageField({ entry }: ScormPackageFieldProps) {
  const attachPackage = useAttachScormPackage(entry.course_section_id);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ApiScormPackage['status'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    },
    [],
  );

  const attachedPackageId = entry.data.scorm_package_id as string | undefined;
  const attachedVersion = entry.data.scorm_version as string | undefined;
  const attachedLaunchPath = entry.data.scorm_launch_path as string | undefined;

  const pollUntilReady = (packageId: string) => {
    scormApi
      .get(packageId)
      .then((res) => {
        const pkg = res.data;
        setProcessingStatus(pkg.status);

        if (pkg.status === 'ready') {
          attachPackage.mutate(
            { entryId: entry.id, scormPackageId: pkg.id },
            {
              onError: (err: unknown) => setError(extractErrorMessage(err)),
              onSettled: () => setProcessingStatus(null),
            },
          );
          return;
        }

        if (pkg.status === 'failed') {
          setProcessingStatus(null);
          setError(pkg.failure_reason ?? "L'extraction du package SCORM a échoué.");
          return;
        }

        pollTimer.current = setTimeout(() => pollUntilReady(packageId), POLL_INTERVAL_MS);
      })
      .catch((err) => {
        setProcessingStatus(null);
        setError(extractErrorMessage(err));
      });
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setUploadProgress(0);
    try {
      const res = await scormApi.upload(file, setUploadProgress);
      setUploadProgress(null);
      setProcessingStatus(res.data.status);
      pollUntilReady(res.data.id);
    } catch (err) {
      setUploadProgress(null);
      setError(extractErrorMessage(err));
    }
  };

  const isBusy = uploadProgress !== null || processingStatus !== null;

  return (
    <div className="space-y-2">
      {attachedPackageId && !isBusy && (
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card p-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Package SCORM rattaché</p>
            <p className="truncate text-xs text-muted-foreground">
              Version {attachedVersion ?? '—'}
              {attachedLaunchPath ? ` · ${attachedLaunchPath}` : ''}
            </p>
          </div>
        </div>
      )}

      <FileUploadField
        fileName={undefined}
        accept=".zip,application/zip,application/x-zip-compressed"
        hint="Package SCORM (.zip)"
        onFileSelect={handleUpload}
        onRemove={() => {}}
      />

      {uploadProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Upload en cours…
            </span>
            <span className="font-semibold text-(--color-primary)">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--color-primary) transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {processingStatus && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          {PROCESSING_LABELS[processingStatus] ?? 'Traitement en cours…'}
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
    </div>
  );
}
