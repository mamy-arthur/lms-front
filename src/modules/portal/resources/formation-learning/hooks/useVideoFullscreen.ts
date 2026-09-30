import { useCallback, useEffect, useRef, useState } from 'react';

type FullscreenContainer = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenVideo = HTMLVideoElement & { webkitExitFullscreen?: () => void };
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function fullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function exitFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
  await exit?.call(doc);
}

/** Expand the existing container, never remount the video or its tracking session. */
export function useVideoFullscreen() {
  const containerRef = useRef<FullscreenContainer>(null);
  const videoRef = useRef<FullscreenVideo>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const entering = useRef(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const expanded = nativeFullscreen || overlay;

  const enter = useCallback(async () => {
    const container = containerRef.current;
    if (!container || entering.current) return;
    entering.current = true;
    try {
      const request = container.requestFullscreen ?? container.webkitRequestFullscreen;
      if (request) {
        try {
          await request.call(container);
          return;
        } catch {
          // An unsupported/denied API must not remove the custom controls.
        }
      }
      // Some browsers ignore controlsList="nofullscreen". Leave their video-only
      // top layer before displaying the fallback, otherwise it would hide us too.
      if (fullscreenElement() === videoRef.current) await exitFullscreen();
      if (containerRef.current === container) setOverlay(true);
    } catch {
      // If the browser refuses exit, its own exit control/Escape remains available.
    } finally {
      entering.current = false;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const sync = () => {
      const element = fullscreenElement();
      setNativeFullscreen(element === containerRef.current);
      // Also handle a native fullscreen command exposed by the browser itself.
      if (element && element === videoRef.current) void enter();
    };
    const leaveVideoOnlyFullscreen = () => {
      if (!video?.webkitExitFullscreen) return;
      video.webkitExitFullscreen();
      setOverlay(true);
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    video?.addEventListener('webkitbeginfullscreen', leaveVideoOnlyFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      video?.removeEventListener('webkitbeginfullscreen', leaveVideoOnlyFullscreen);
    };
  }, [enter]);

  useEffect(() => {
    if (!overlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOverlay(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [overlay]);

  async function toggleFullscreen() {
    if (!expanded) {
      await enter();
      return;
    }
    if (nativeFullscreen) {
      try {
        await exitFullscreen();
      } catch {
        return;
      }
    }
    setOverlay(false);
    toggleRef.current?.focus();
  }

  return { containerRef, videoRef, toggleRef, expanded, toggleFullscreen };
}
