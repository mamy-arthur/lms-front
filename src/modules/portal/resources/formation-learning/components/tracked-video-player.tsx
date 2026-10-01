'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VideoProgressContext } from '@/shared/api/portal-video.api';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';
import { selectSessionIdentity, useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { useVideoFullscreen } from '../hooks/useVideoFullscreen';
import {
  VideoProgressSession,
  type RegisterVideoSession,
  type VideoSaveStatus,
} from '../lib/videoProgressSession';

export interface VideoTrackingProps {
  context: Omit<VideoProgressContext, 'mediaId'>;
  execution: ExecutionMutationContext | null;
  readOnly: boolean;
  onExecutionConflict?: (error: unknown) => void;
  registerVideoSession?: RegisterVideoSession;
}

export default function TrackedVideoPlayer({
  src,
  mediaId,
  context,
  execution,
  readOnly,
  onExecutionConflict,
  registerVideoSession,
}: VideoTrackingProps & { src: string; mediaId: string }) {
  const { containerRef, videoRef, toggleRef, expanded, toggleFullscreen } = useVideoFullscreen();
  const sessionRef = useRef<VideoProgressSession | null>(null);
  const [, setStatus] = useState<VideoSaveStatus>('loading');
  const [seekableSource, setSeekableSource] = useState<string | null>(null);
  const identity = useAuthStore(selectSessionIdentity);
  const simulatedRole = useAuthStore((state) => state.simulatedRole);
  const tenantId = useTenantStore((state) => state.tenant?.id);
  const epoch = useSimulationStore((state) => state.epoch);
  const phase = useSimulationStore((state) => state.phase);
  const { enrollmentId, courseId, entryId, competencyId, nodeExecutionId } = context;
  const executionRef = useRef(execution);
  const onExecutionConflictRef = useRef(onExecutionConflict);
  useEffect(() => {
    onExecutionConflictRef.current = onExecutionConflict;
  }, [onExecutionConflict]);
  useEffect(() => {
    executionRef.current = execution;
    sessionRef.current?.updateExecution(execution);
  }, [execution]);

  useEffect(() => {
    if (!videoRef.current) return;
    const session = new VideoProgressSession(
      videoRef.current,
      { enrollmentId, courseId, entryId, competencyId, nodeExecutionId, mediaId },
      executionRef.current,
      readOnly,
      setStatus,
      (error) => onExecutionConflictRef.current?.(error),
    );
    sessionRef.current = session;
    session.start();
    const unregister = registerVideoSession?.(session);
    return () => {
      unregister?.();
      session.dispose();
      sessionRef.current = null;
    };
  }, [
    enrollmentId,
    courseId,
    entryId,
    competencyId,
    nodeExecutionId,
    mediaId,
    src,
    readOnly,
    registerVideoSession,
    identity,
    tenantId,
    epoch,
    phase,
    simulatedRole,
    videoRef,
  ]);

  function updateSeekAvailability() {
    const duration = videoRef.current?.duration;
    setSeekableSource(
      duration !== undefined && Number.isFinite(duration) && duration > 0 ? src : null,
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group/video overflow-hidden ${expanded ? 'fixed inset-0 z-[100] h-dvh w-full bg-black' : 'relative rounded-lg'}`}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nofullscreen"
        playsInline
        preload="metadata"
        aria-label="Vidéo de formation"
        onLoadedMetadata={updateSeekAvailability}
        onDurationChange={updateSeekAvailability}
        onEmptied={() => setSeekableSource(null)}
        onErrorCapture={() => setSeekableSource(null)}
        className={`block w-full bg-black [&::-webkit-media-controls-fullscreen-button]:hidden ${expanded ? 'h-full object-contain' : 'max-h-[70vh]'}`}
      >
        Votre navigateur ne prend pas en charge la lecture vidéo.
      </video>
      <Button
        ref={toggleRef}
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void toggleFullscreen()}
        aria-label={expanded ? 'Quitter le plein écran' : 'Afficher en plein écran'}
        title={expanded ? 'Quitter le plein écran' : 'Afficher en plein écran'}
        aria-pressed={expanded}
        className={`absolute right-3 top-3 z-10 size-11 rounded-full border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-sm hover:bg-black/80 hover:text-white focus-visible:ring-white/70 dark:bg-black/60 ${expanded ? '' : 'opacity-0 transition-opacity group-hover/video:opacity-100 group-focus-within/video:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100'}`}
      >
        {expanded ? (
          <Minimize2 className="size-5" aria-hidden="true" />
        ) : (
          <Maximize2 className="size-5" aria-hidden="true" />
        )}
      </Button>
      <div
        role="group"
        aria-label="Déplacement dans la vidéo"
        className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4 opacity-0 transition-opacity duration-200 group-hover/video:opacity-100 group-focus-within/video:opacity-100 motion-reduce:transition-none sm:px-6 [@media(hover:none)]:opacity-100"
      >
        <Button
          type="button"
          variant="outline"
          className="pointer-events-none size-14 flex-col gap-0.5 rounded-full border-white/20 bg-black/60 p-0 text-[11px] text-white shadow-lg backdrop-blur-sm group-hover/video:pointer-events-auto group-focus-within/video:pointer-events-auto hover:bg-black/80 hover:text-white focus-visible:ring-white/70 dark:bg-black/60 [@media(hover:none)]:pointer-events-auto"
          aria-label="Reculer de 10 secondes"
          title="Reculer de 10 secondes"
          disabled={seekableSource !== src}
          onClick={() => sessionRef.current?.seekBy(-10)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          −10 s
        </Button>
        <Button
          type="button"
          variant="outline"
          className="pointer-events-none size-14 flex-col gap-0.5 rounded-full border-white/20 bg-black/60 p-0 text-[11px] text-white shadow-lg backdrop-blur-sm group-hover/video:pointer-events-auto group-focus-within/video:pointer-events-auto hover:bg-black/80 hover:text-white focus-visible:ring-white/70 dark:bg-black/60 [@media(hover:none)]:pointer-events-auto"
          aria-label="Avancer de 10 secondes"
          title="Avancer de 10 secondes"
          disabled={seekableSource !== src}
          onClick={() => sessionRef.current?.seekBy(10)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          +10 s
        </Button>
      </div>
    </div>
  );
}
