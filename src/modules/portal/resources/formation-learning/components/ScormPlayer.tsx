'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { portalScormApi } from '@/shared/api/portal-scorm.api';
import { portalScormLaunchKeys } from '@/shared/queries/keys';
import { ScormSession, bindScormWindowApi } from '../lib/scormRuntime';
import { ScormPreviewSession, getScormPreviewLaunchUrl } from '../lib/scormPreviewRuntime';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { SimulationControls } from '@/shared/simulation/SimulationControls';

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

  const [readySessionKey, setReadySessionKey] = useState<string | null>(null);
  const [failedSessionKey, setFailedSessionKey] = useState<string | null>(null);

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
  const readOnly = launch?.read_only === true;
  const demo = !!simulatedRole && !readOnly;
  const previewUrl =
    simulatedRole && readOnly && typeof window !== 'undefined'
      ? getScormPreviewLaunchUrl(launch.launch_url, window.location.origin)
      : null;
  const invalidPreview = readOnly && (!previewUrl || !['1.2', '2004'].includes(launch.version));
  // A new package/context must never reuse readiness from the previous adapter.
  const sessionKey = JSON.stringify([
    enrollmentId,
    competencyId,
    courseId,
    entryId,
    launch?.scorm_package_id,
    launch?.version,
    launch?.launch_url,
    readOnly,
    simulatedRole,
  ]);
  const failed = launchQuery.isError || invalidPreview || failedSessionKey === sessionKey;
  const ready = demo ? !!launch : readySessionKey === sessionKey;

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

    try {
      await (element.requestFullscreen?.() ?? element.webkitRequestFullscreen?.());
    } catch {
      setOverlay(true);
    }
  }, [expanded, nativeFullscreen]);

  useEffect(() => {
    if (!launch || failed || demo) return;

    if (readOnly) {
      const preview = new ScormPreviewSession(launch.version);
      const dispose = preview.bind(window);
      setReadySessionKey(sessionKey);
      return () => {
        setReadySessionKey(null);
        dispose();
      };
    }

    let cancelled = false;
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
      if (!cancelled && ok) setReadySessionKey(sessionKey);
    });

    return () => {
      cancelled = true;
      setReadySessionKey(null);
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
    sessionKey,
    failed,
    demo,
    readOnly,
  ]);

  if (launchQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (failed || !launch) {
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
    // same classes are harmless. `relative` must not coexist with `fixed`: both
    // set `position` and Tailwind emits `relative` last, so it would win.
    <div
      ref={containerRef}
      className={`flex flex-col ${expanded ? 'fixed inset-0 z-50 bg-white' : 'relative gap-2'}`}
    >
      {readOnly && (
        <p
          role="status"
          className={`shrink-0 bg-amber-50 px-3 py-2 text-sm text-amber-950 ${
            expanded && simulatedRole ? 'pr-72' : 'pr-14'
          }`}
        >
          Lecture seule — aucun score, temps ou progression enregistré.
        </p>
      )}
      {ready && (
        <div
          className={expanded ? 'absolute right-3 top-3 z-10 flex items-center gap-2' : 'self-end'}
        >
          {/* The header — and its simulation exit button — is hidden while expanded. */}
          {expanded && simulatedRole && <SimulationControls />}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={expanded ? 'Quitter le plein écran' : 'Afficher en plein écran'}
            className={`rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
              expanded ? 'bg-white/90 shadow-sm' : ''
            }`}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
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
        on only one side has no effect. Normal playback matches the backend config;
        previews deliberately withhold forms, popups and top navigation. Scripts and
        same-origin are still needed for synchronous API discovery: this does NOT
        isolate hostile packages from the parent origin.

        `allow` carries the Permissions Policy the iframe needs to delegate: fullscreen
        video is standard in SCORM content and is gated by this attribute, not by the
        sandbox. Camera/microphone are intentionally NOT delegated to untrusted content.
      */}
      <iframe
        key={sessionKey}
        title="Contenu SCORM"
        src={!demo && ready ? (previewUrl ?? launch.launch_url) : undefined}
        srcDoc={
          demo
            ? '<!doctype html><html lang="fr"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; form-action &apos;none&apos;"><h1>Activité SCORM de démonstration</h1><p>Explorez ce contenu fictif, puis terminez l’activité. Votre progression reste locale.</p></html>'
            : undefined
        }
        sandbox={
          demo
            ? ''
            : readOnly
              ? 'allow-scripts allow-same-origin'
              : 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-presentation allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation'
        }
        allow={
          readOnly
            ? "fullscreen 'none'; autoplay; encrypted-media"
            : 'fullscreen; autoplay; encrypted-media; picture-in-picture; clipboard-write'
        }
        allowFullScreen={!readOnly}
        onErrorCapture={readOnly ? () => setFailedSessionKey(sessionKey) : undefined}
        className={`w-full bg-white ${
          expanded ? 'min-h-0 flex-1 border-0' : 'h-[70vh] rounded-lg border border-slate-200'
        } ${ready ? '' : 'hidden'}`}
      />
      {demo && (
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
