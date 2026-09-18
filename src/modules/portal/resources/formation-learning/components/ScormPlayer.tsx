'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { portalScormApi } from '@/shared/api/portal-scorm.api';
import { portalScormLaunchKeys } from '@/shared/queries/keys';
import { ScormSession, bindScormWindowApi } from '../lib/scormRuntime';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';

interface Props {
  enrollmentId: string;
  competencyId: string;
  courseId: string;
  entryId: string;
  onCompleted?: () => void;
}

/**
 * Safari (iPadOS included) still only exposes the prefixed Fullscreen API, and
 * iPhone Safari exposes none at all on arbitrary elements — hence the fallback
 * overlay in the player below.
 */
interface PrefixedFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}
interface PrefixedFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

function fullscreenElement(): Element | null {
  const doc = document as PrefixedFullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Loads a SCORM package (API.md §22.9), boots the RTE bridge (§22.10) and
 * renders the launch page in a sandboxed same-origin iframe so the SCORM
 * content can find `window.parent.API`/`API_1484_11`.
 */
export default function ScormPlayer({
  enrollmentId,
  competencyId,
  courseId,
  entryId,
  onCompleted,
}: Props) {
  const simulatedRole = useAuthStore((state) => state.simulatedRole);
  const launchQuery = useQuery({
    queryKey: portalScormLaunchKeys.detail(enrollmentId, competencyId, courseId, entryId),
    queryFn: async () =>
      (await portalScormApi.launch(enrollmentId, competencyId, courseId, entryId)).data,
    staleTime: 0,
  });

  const [isReady, setIsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  // Two distinct ways of being expanded: the real Fullscreen API, and a fixed
  // overlay used only when the API refuses (iPhone Safari, a restrictive
  // Permissions-Policy upstream). `expanded` is what the layout keys off.
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const expanded = nativeFullscreen || overlay;

  const launch = launchQuery.data;
  const ready = simulatedRole ? !!launch : isReady;

  // The SCORM content can request fullscreen on itself, in which case the
  // fullscreen element is the iframe, not our container — only our own container
  // should drive the layout switch, so compare identities rather than truthiness.
  useEffect(() => {
    const sync = () => setNativeFullscreen(fullscreenElement() === containerRef.current);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // Escape is handled by the browser in native fullscreen, but not by the overlay
  // fallback. It only fires while focus is outside the iframe; the toggle button
  // stays visible precisely because that is not guaranteed.
  useEffect(() => {
    if (!overlay) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOverlay(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [overlay]);

  const toggleFullscreen = useCallback(async () => {
    const element = containerRef.current as PrefixedFullscreenElement | null;
    if (!element) return;

    if (expanded) {
      const doc = document as PrefixedFullscreenDocument;
      if (nativeFullscreen) await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      setOverlay(false);
      return;
    }

    // Native fullscreen would hide the persistent simulation banner.
    if (simulatedRole) {
      setOverlay(true);
      return;
    }

    try {
      await (element.requestFullscreen?.() ?? element.webkitRequestFullscreen?.());
    } catch {
      setOverlay(true);
    }
  }, [expanded, nativeFullscreen, simulatedRole]);

  useEffect(() => {
    if (!launch || simulatedRole) return;
    let cancelled = false;
    setIsReady(false);
    const epoch = useSimulationStore.getState().epoch;

    const session = new ScormSession({
      enrollmentId,
      competencyId,
      courseId,
      entryId,
      version: launch.version,
      isContextCurrent: () => {
        const context = useSimulationStore.getState();
        return (
          context.epoch === epoch &&
          (context.phase === 'ready' || context.phase === 'idle') &&
          !useAuthStore.getState().simulatedRole
        );
      },
      onCompleted: () => onCompletedRef.current?.(),
    });

    // Bound *before* the iframe starts loading: SCORM content looks up
    // window.parent.API(_1484_11) as soon as it executes, not on "load".
    const unbind = bindScormWindowApi(window, session, launch.version);

    session.preload().then((ok) => {
      if (!cancelled && ok) setIsReady(true);
    });

    return () => {
      cancelled = true;
      session.apiFinish();
      unbind();
    };
  }, [
    enrollmentId,
    competencyId,
    courseId,
    entryId,
    launch?.scorm_package_id,
    launch?.version,
    simulatedRole,
  ]);

  if (launchQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (launchQuery.isError || !launch) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-500">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm">Impossible de charger le contenu SCORM.</p>
      </div>
    );
  }

  return (
    // `fixed inset-0` is what makes the overlay fallback work; in native
    // fullscreen the element is already promoted to the top layer, where those
    // same classes are harmless.
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-2 ${
        expanded ? 'fixed inset-0 z-50 gap-0 bg-white' : ''
      }`}
    >
      {ready && (
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={expanded ? 'Quitter le plein écran' : 'Afficher en plein écran'}
          className={`rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
            expanded ? 'absolute right-3 top-3 z-10 bg-white/90 shadow-sm' : 'self-end'
          }`}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
      {!ready && (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {/*
        The effective sandbox is the INTERSECTION of this attribute and the `sandbox`
        directive in the Content-Security-Policy the backend sends with the asset
        (learneo-be config/scorm.php → asset_csp_directives.sandbox). A token granted
        on only one side has no effect, so the two lists must stay in sync — read that
        config for why each token is granted and why bare `allow-top-navigation` is not.

        `allow` carries the Permissions Policy the iframe needs to delegate: fullscreen
        video is standard in SCORM content and is gated by this attribute, not by the
        sandbox. Camera/microphone are intentionally NOT delegated to untrusted content.
      */}
      <iframe
        key={launch.scorm_package_id}
        title="Contenu SCORM"
        src={!simulatedRole && ready ? launch.launch_url : undefined}
        srcDoc={
          simulatedRole
            ? '<!doctype html><html lang="fr"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; form-action &apos;none&apos;"><h1>Activité SCORM de démonstration</h1><p>Explorez ce contenu fictif, puis terminez l’activité. Votre progression reste locale.</p></html>'
            : undefined
        }
        sandbox={
          simulatedRole
            ? ''
            : 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-presentation allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation'
        }
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture; clipboard-write"
        allowFullScreen
        className={`w-full bg-white ${
          expanded ? 'h-full border-0' : 'h-[70vh] rounded-lg border border-slate-200'
        } ${ready ? '' : 'hidden'}`}
      />
      {simulatedRole && (
        <button
          type="button"
          className="self-end rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => onCompletedRef.current?.()}
        >
          Terminer l’activité simulée
        </button>
      )}
    </div>
  );
}
