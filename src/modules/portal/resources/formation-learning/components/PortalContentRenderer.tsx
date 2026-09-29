import type { ApiPortalContentEntry } from '@/shared/types/portal.types';
import { RichTextRenderer } from '@/shared/components/RichTextRenderer';
import { Loader2, FileDown, ExternalLink, FolderOpen } from 'lucide-react';
import { getHttpContentUrl, toYouTubeEmbedUrl } from '@/lib/utils';
import { getMediaCategory } from '@/modules/shared/components/courses/contents/forms/fields/media-utils';
import ScormPlayer from './ScormPlayer';
import type { RegisterScormSession } from '../lib/scormRuntime';
import TrackedVideoPlayer, { type VideoTrackingProps } from './TrackedVideoPlayer';
import type { RegisterVideoSession } from '../lib/videoProgressSession';

interface Props {
  entry: ApiPortalContentEntry | undefined;
  isLoading: boolean;
  /** Required to render the 'scorm' module_type (launch/tracking are enrollment-scoped). */
  enrollmentId: string;
  competencyId?: string;
  courseId?: string;
  /** Visite active ou historique consultée, et révision lue. */
  nodeExecutionId: string | null;
  expectedStateRevision: number | null;
  readOnly: boolean;
  onScormCompleted?: () => void;
  onScormExecutionConflict?: (error: unknown) => void;
  registerScormSession?: RegisterScormSession;
  registerVideoSession?: RegisterVideoSession;
}

// Extra utility classes for portal richtext content.
const RICHTEXT_EXTRA_CLASSES =
  'richtext-content [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:table-fixed';

type ResolvedMedia = { id: string; url: string; mime_type: string };

function isResolvedMedia(v: unknown): v is ResolvedMedia {
  return !!v && typeof v === 'object' && 'url' in v && 'mime_type' in v;
}

/** Upgrades http:// → https:// when the page itself is served over HTTPS (avoids mixed-content blocks). */
function secureUrl(url: string): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return url.replace(/^http:\/\//i, 'https://');
  }
  return url;
}

/** Renders a single resolved media object using the same logic as MediaPreviewModal. */
function MediaPlayer({ media, tracking }: { media: ResolvedMedia; tracking?: VideoTrackingProps }) {
  const category = getMediaCategory(media.mime_type);

  if (category === 'video') {
    if (tracking && typeof media.id === 'string' && media.id)
      return (
        <TrackedVideoPlayer
          key={media.id}
          src={secureUrl(media.url)}
          mediaId={media.id}
          {...tracking}
        />
      );
    return (
      <video
        src={secureUrl(media.url)}
        controls
        className="max-h-[70vh] w-full rounded-lg bg-black"
      />
    );
  }
  if (category === 'audio') {
    return <audio src={secureUrl(media.url)} controls className="w-full" />;
  }
  if (category === 'image') {
    return (
      <img
        src={secureUrl(media.url)}
        alt=""
        className="max-w-full max-h-[70vh] rounded-lg object-contain"
      />
    );
  }
  if (category === 'pdf') {
    return (
      <iframe
        src={secureUrl(media.url)}
        title="PDF"
        className="w-full h-[70vh] rounded-lg border border-slate-200"
      />
    );
  }
  // Generic file download
  return (
    <a
      href={secureUrl(media.url)}
      download
      className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
    >
      <FileDown className="h-4 w-4" />
      Télécharger le fichier
    </a>
  );
}

/**
 * Field-driven renderer: iterates all fields in order and renders each one
 * based on its declared type. Works regardless of module_type.
 */
function FieldsRenderer({
  data,
  fieldTypes,
  tracking,
}: {
  data: Record<string, unknown>;
  fieldTypes: Record<string, string>;
  tracking?: VideoTrackingProps;
}) {
  const rendered: React.ReactNode[] = [];

  for (const [key, value] of Object.entries(data)) {
    const type = fieldTypes[key];

    if (type === 'richtext' && typeof value === 'string' && value) {
      rendered.push(
        <RichTextRenderer key={key} content={value} className={RICHTEXT_EXTRA_CLASSES} />,
      );
      continue;
    }

    if (type === 'textarea' && typeof value === 'string' && value) {
      // description fields are shown in the FormationContentView header — skip here.
      if (key === 'describe' || key === 'description') continue;
      rendered.push(
        <p key={key} className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {value}
        </p>,
      );
      continue;
    }

    if ((type === 'text' || type === 'url') && typeof value === 'string' && value) {
      // 'title' is already rendered in the FormationContentView header — skip it here.
      if (key === 'title') continue;
      // URL fields — try to embed as iframe
      if (type === 'url' || key === 'url' || /^\s*https?:/i.test(value)) {
        const url = getHttpContentUrl(value);
        if (!url) continue;
        const href = secureUrl(url);
        rendered.push(
          <div key={key} className="flex flex-col gap-3">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {value}
            </a>
            <p className="text-xs text-slate-500">
              Si le site refuse l’affichage intégré, ouvrez le lien dans un nouvel onglet.
            </p>
            <iframe
              title="Contenu externe"
              src={toYouTubeEmbedUrl(href)}
              className="w-full rounded-lg border border-slate-200 h-[60vh]"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="no-referrer"
              allowFullScreen
            />
          </div>,
        );
      } else {
        rendered.push(
          <p key={key} className="text-sm text-slate-700">
            {value}
          </p>,
        );
      }
      continue;
    }

    if (type === 'media') {
      if (isResolvedMedia(value)) {
        rendered.push(<MediaPlayer key={key} media={value} tracking={tracking} />);
      } else if (Array.isArray(value)) {
        // multiple media field
        rendered.push(
          <div key={key} className="flex flex-col gap-3">
            {value.filter(isResolvedMedia).map((m) => (
              <MediaPlayer key={m.id} media={m} tracking={tracking} />
            ))}
          </div>,
        );
      }
      continue;
    }
  }

  return rendered.length > 0 ? (
    <div className="flex flex-col gap-6">{rendered}</div>
  ) : (
    <p className="text-slate-400 italic text-sm">Aucun contenu disponible.</p>
  );
}

export default function PortalContentRenderer({
  entry,
  isLoading,
  enrollmentId,
  competencyId,
  courseId,
  nodeExecutionId,
  expectedStateRevision,
  readOnly,
  onScormCompleted,
  onScormExecutionConflict,
  registerScormSession,
  registerVideoSession,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return <p className="text-slate-400 italic text-sm">Contenu non disponible.</p>;
  }

  if (entry.module_type === 'scorm') {
    const scormPackageId =
      typeof entry.data.scorm_package_id === 'string' ? entry.data.scorm_package_id : null;
    // Reading requires an authorized visit, not necessarily the active one.
    if (
      !scormPackageId ||
      !competencyId ||
      !courseId ||
      !nodeExecutionId ||
      expectedStateRevision === null
    ) {
      return (
        <p className="text-slate-400 italic text-sm">Aucun package SCORM rattaché à ce contenu.</p>
      );
    }
    return (
      <ScormPlayer
        enrollmentId={enrollmentId}
        competencyId={competencyId}
        courseId={courseId}
        entryId={entry.id}
        nodeExecutionId={nodeExecutionId}
        expectedStateRevision={expectedStateRevision}
        readOnly={readOnly}
        onCompleted={onScormCompleted}
        onExecutionConflict={onScormExecutionConflict}
        registerSession={registerScormSession}
      />
    );
  }

  const tracking: VideoTrackingProps | undefined =
    courseId && competencyId && nodeExecutionId
      ? {
          context: { enrollmentId, courseId, entryId: entry.id, competencyId, nodeExecutionId },
          execution:
            nodeExecutionId && expectedStateRevision !== null
              ? {
                  node_execution_id: nodeExecutionId,
                  expected_state_revision: expectedStateRevision,
                }
              : null,
          readOnly,
          registerVideoSession,
        }
      : undefined;

  // module_type === 'folder' is the only other special case needing a different layout.
  if (entry.module_type === 'folder') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          <FolderOpen className="h-5 w-5" />
          <span className="text-sm">Dossier</span>
        </div>
        <FieldsRenderer data={entry.data} fieldTypes={entry.field_types} tracking={tracking} />
      </div>
    );
  }

  return <FieldsRenderer data={entry.data} fieldTypes={entry.field_types} tracking={tracking} />;
}
