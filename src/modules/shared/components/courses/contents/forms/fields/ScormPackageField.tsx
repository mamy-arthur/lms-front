'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Trash, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUploadField } from '@/modules/shared/components/input-upload/FileUploadField';
import type { ScormPackageStatus } from '@/shared/api/scorm.api';
import {
  isTerminalScormStatus,
  usePatchScormPackageStatus,
  useScormPackageQuery,
  useUploadScormPackageMutation,
} from '@/shared/hooks/useScormPackage';
import {
  useScormPackageChannel,
  type ScormPackageStatusChangedEvent,
} from '@/shared/hooks/useScormPackageChannel';
import { extractErrorMessage, formatFileSize } from './media-utils';

/**
 * Présentation du statut sous forme de badge.
 *
 * Le statut était rendu en gris `text-muted-foreground`, à la même taille que la
 * taille du fichier juste en dessous : il se lisait comme une métadonnée parmi
 * d'autres. Or c'est l'information qui décide si le contenu est publiable ou non
 * — d'où un badge coloré, avec une icône qui tourne tant que le traitement dure.
 */
const STATUS_BADGE: Record<
  ScormPackageStatus,
  { label: string; icon: LucideIcon; spin?: boolean; className: string }
> = {
  pending: {
    label: 'En attente',
    icon: Loader2,
    spin: true,
    className: 'bg-slate-100 text-slate-600',
  },
  extracting: {
    label: 'Extraction…',
    icon: Loader2,
    spin: true,
    className: 'bg-blue-100 text-blue-700',
  },
  extracted: {
    label: 'Analyse du manifeste…',
    icon: Loader2,
    spin: true,
    className: 'bg-blue-100 text-blue-700',
  },
  ready: {
    label: 'Prêt',
    icon: Check,
    className: 'bg-emerald-100 text-emerald-700',
  },
  failed: {
    label: 'Échec',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive',
  },
};

function ScormStatusBadge({
  status,
  version,
}: {
  status: ScormPackageStatus;
  version: string | null;
}) {
  const { label, icon: Icon, spin, className } = STATUS_BADGE[status];

  return (
    <Badge className={className}>
      <Icon className={spin ? 'animate-spin' : undefined} />
      {label}
      {status === 'ready' && version && ` · v${version}`}
    </Badge>
  );
}

export interface ScormPackageFieldState {
  packageId: string | null;
  status: ScormPackageStatus | null;
}

interface ScormPackageFieldProps {
  /** Package déjà attaché à l'entrée (édition), ou `null` pour une entrée pas encore créée. */
  attachedPackageId: string | null;
  /** Notifie le parent du package courant (uploadé ou déjà attaché) et de son statut, afin de
   *  déclencher la liaison au clic sur « Enregistrer » et de conditionner la publication. */
  onStateChange?: (state: ScormPackageFieldState) => void;
}

/**
 * Upload un package SCORM et suit son traitement via la WebSocket du backend
 * (aucun polling). La liaison à l'entrée de contenu n'est pas faite ici : elle
 * est déclenchée par le parent au clic sur « Enregistrer ».
 */
export function ScormPackageField({ attachedPackageId, onStateChange }: ScormPackageFieldProps) {
  // Seule vraie state locale : quel package ce champ suit. Le contenu du package
  // et son statut viennent du cache de la query, pour éviter deux sources de vérité.
  const [packageId, setPackageId] = useState<string | null>(attachedPackageId);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: pkg, isLoading, isError } = useScormPackageQuery(packageId);
  const uploadPackage = useUploadScormPackageMutation();
  const patchStatus = usePatchScormPackageStatus();

  const status = pkg?.status ?? null;
  const hasFailed = status === 'failed';

  // Un package en échec ne doit jamais être présenté comme disponible au parent :
  // il ne sera ni rattaché à l'entrée, ni considéré comme publiable.
  const availablePackageId = hasFailed ? null : packageId;

  useEffect(() => {
    onStateChange?.({ packageId: availablePackageId, status });
  }, [availablePackageId, status, onStateChange]);

  const handleStatusChanged = useCallback(
    (event: ScormPackageStatusChangedEvent) => {
      patchStatus(event.packageId, event.status, event.errorMessage);
    },
    [patchStatus],
  );

  const handleSubscriptionError = useCallback(() => {
    setError('Connexion au suivi temps réel du package SCORM impossible.');
  }, []);

  // `ready` et `failed` sont terminaux côté backend : plus aucun event ne viendra.
  // On passe donc `null` pour que le hook se désabonne — sans quoi le channel privé
  // restait ouvert et relançait une requête d'authentification broadcasting pour
  // rien, à chaque montage d'un formulaire dont le package était déjà traité.
  const trackedPackageId = isTerminalScormStatus(status) ? null : packageId;
  useScormPackageChannel(trackedPackageId, handleStatusChanged, handleSubscriptionError);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploadProgress(0);
    try {
      const created = await uploadPackage.mutateAsync({ file, onProgress: setUploadProgress });
      // La mutation a déjà semé le cache : passer l'id suffit, aucun GET ne suit.
      setPackageId(created.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemove = () => {
    setPackageId(null);
    setError(null);
  };

  const isCheckingInitialStatus = !!packageId && isLoading;
  const isBusy = uploadProgress !== null || isCheckingInitialStatus;
  const isPendingAttachment = !!availablePackageId && availablePackageId !== attachedPackageId;
  const showCard = !!pkg && !isBusy && !hasFailed;

  return (
    <div className="space-y-2">
      {isCheckingInitialStatus && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Vérification du statut du package SCORM…
        </p>
      )}

      {showCard && pkg ? (
        <div className="relative flex flex-col gap-3 w-75 rounded-sm bg-card">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Supprimer"
            className="z-50 absolute top-1.5 right-1.5 size-5 rounded-full bg-black/50 text-white hover:bg-destructive hover:text-white transition-colors"
            onClick={handleRemove}
          >
            <Trash className="size-2.5" />
          </Button>

          <div className="h-50 shrink-0 rounded flex items-center justify-center bg-gray-50 dark:bg-orange-900/30">
            <img src="/assets/book.png" alt="SCORM" className="h-12 w-12 object-contain" />
          </div>

          <div className="flex-1 min-w-0 pr-7">
            <span className="block truncate text-xs font-medium">{pkg.original_filename}</span>
            <span className="text-xs text-muted-foreground">{formatFileSize(pkg.size_bytes)}</span>
            {status && (
              <div className="mt-1.5">
                <ScormStatusBadge status={status} version={pkg.version} />
              </div>
            )}
          </div>
        </div>
      ) : (
        !isBusy && (
          <FileUploadField
            fileName={undefined}
            accept=".zip,application/zip,application/x-zip-compressed"
            hint="Package SCORM (.zip)"
            onFileSelect={handleUpload}
            onRemove={() => {}}
          />
        )
      )}

      {isPendingAttachment && status === 'ready' && (
        <p className="text-xs text-muted-foreground">
          Cliquez sur « Enregistrer » pour rattacher ce package à ce contenu.
        </p>
      )}

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

      {hasFailed && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />
          {pkg?.failure_reason ?? "L'extraction du package SCORM a échoué."}
        </p>
      )}

      {isError && !error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> Impossible de récupérer le statut du package SCORM.
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
