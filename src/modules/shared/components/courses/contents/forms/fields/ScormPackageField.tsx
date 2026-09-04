'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import { scormApi, type ApiScormPackage, type ScormPackageStatus } from '@/shared/api/scorm.api';
import {
  useScormPackageChannel,
  type ScormPackageStatusChangedEvent,
} from '@/shared/hooks/useScormPackageChannel';
import type { ApiContentEntry } from '@/shared/types/course.types';
import { extractErrorMessage } from './media-utils';

const PROCESSING_LABELS: Record<string, string> = {
  pending: 'En attente de traitement…',
  extracting: 'Extraction du package…',
  extracted: 'Analyse du manifeste…',
};

export interface ScormPackageFieldState {
  packageId: string | null;
  status: ScormPackageStatus | null;
}

interface ScormPackageFieldProps {
  entry: ApiContentEntry;
  /** Notifie le parent du package courant (uploadé ou déjà attaché) et de son statut, afin de
   *  déclencher la liaison au clic sur « Enregistrer » et de conditionner la publication. */
  onStateChange?: (state: ScormPackageFieldState) => void;
}

/**
 * Upload un package SCORM et suit son traitement via la WebSocket du backend
 * (aucun polling). La liaison à l'entrée de contenu n'est pas faite ici : elle
 * est déclenchée par le parent au clic sur « Enregistrer ».
 */
export function ScormPackageField({ entry, onStateChange }: ScormPackageFieldProps) {
  const attachedPackageId = (entry.data.scorm_package_id as string | undefined) ?? null;

  const [packageId, setPackageId] = useState<string | null>(attachedPackageId);
  const [pkg, setPkg] = useState<ApiScormPackage | null>(null);
  const [status, setStatus] = useState<ScormPackageStatus | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [isCheckingInitialStatus, setIsCheckingInitialStatus] = useState(!!attachedPackageId);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report the current package/status up so the parent can attach it on save
  // and gate publication until it is ready.
  useEffect(() => {
    onStateChange?.({ packageId, status });
  }, [packageId, status, onStateChange]);

  // Fetch the current state of an already-attached package once on mount —
  // it may still be processing, or may have finished while the page was closed.
  useEffect(() => {
    if (!attachedPackageId) return;
    let cancelled = false;
    setIsCheckingInitialStatus(true);
    scormApi
      .get(attachedPackageId)
      .then((res) => {
        if (cancelled) return;
        setPkg(res.data);
        setStatus(res.data.status);
        if (res.data.status === 'failed') {
          setFailureReason(res.data.failure_reason ?? "L'extraction du package SCORM a échoué.");
        }
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de récupérer le statut du package SCORM.');
      })
      .finally(() => {
        if (!cancelled) setIsCheckingInitialStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attachedPackageId]);

  const handleStatusChanged = useCallback((event: ScormPackageStatusChangedEvent) => {
    setStatus(event.status);
    if (event.status === 'ready') {
      scormApi
        .get(event.packageId)
        .then((res) => setPkg(res.data))
        .catch(() => setError('Impossible de récupérer les informations du package SCORM traité.'));
    } else if (event.status === 'failed') {
      setFailureReason(event.errorMessage ?? "L'extraction du package SCORM a échoué.");
    }
  }, []);

  const handleSubscriptionError = useCallback(() => {
    setError('Connexion au suivi temps réel du package SCORM impossible.');
  }, []);

  useScormPackageChannel(packageId, handleStatusChanged, handleSubscriptionError);

  const handleUpload = async (file: File) => {
    setError(null);
    setFailureReason(null);
    setPkg(null);
    setUploadProgress(0);
    try {
      const res = await scormApi.upload(file, setUploadProgress);
      setUploadProgress(null);
      setPkg(res.data);
      setStatus(res.data.status);
      setPackageId(res.data.id);
    } catch (err) {
      setUploadProgress(null);
      setError(extractErrorMessage(err));
    }
  };

  const isPendingAttachment = !!packageId && packageId !== attachedPackageId;
  const isBusy = uploadProgress !== null || isCheckingInitialStatus;

  return (
    <div className="space-y-2">
      {isCheckingInitialStatus && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Vérification du statut du package SCORM…
        </p>
      )}

      {status === 'ready' && !isBusy && (
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card p-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Package SCORM prêt</p>
            <p className="truncate text-xs text-muted-foreground">
              Version {pkg?.version ?? '—'}
              {pkg?.launch_path ? ` · ${pkg.launch_path}` : ''}
            </p>
          </div>
        </div>
      )}

      {status && status !== 'ready' && status !== 'failed' && !isBusy && (
        <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 p-3">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <p className="truncate text-xs text-muted-foreground">
            {PROCESSING_LABELS[status] ?? 'Traitement en cours…'}
          </p>
        </div>
      )}

      {isPendingAttachment && status === 'ready' && (
        <p className="text-xs text-muted-foreground">
          Cliquez sur « Enregistrer » pour rattacher ce package à ce contenu.
        </p>
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

      {status === 'failed' && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> {failureReason}
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
