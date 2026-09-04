'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { portalScormApi } from '@/shared/api/portal-scorm.api';
import { portalScormLaunchKeys } from '@/shared/queries/keys';
import { ScormSession, bindScormWindowApi } from '../lib/scormRuntime';

interface Props {
  enrollmentId: string;
  courseId: string;
  entryId: string;
  onCompleted?: () => void;
}

/**
 * Loads a SCORM package (API.md §22.9), boots the RTE bridge (§22.10) and
 * renders the launch page in a sandboxed same-origin iframe so the SCORM
 * content can find `window.parent.API`/`API_1484_11`.
 */
export default function ScormPlayer({ enrollmentId, courseId, entryId, onCompleted }: Props) {
  const launchQuery = useQuery({
    queryKey: portalScormLaunchKeys.detail(enrollmentId, courseId, entryId),
    queryFn: async () => (await portalScormApi.launch(enrollmentId, courseId, entryId)).data,
    staleTime: 0,
  });

  const [isReady, setIsReady] = useState(false);

  const launch = launchQuery.data;

  useEffect(() => {
    if (!launch) return;
    let cancelled = false;
    setIsReady(false);

    const session = new ScormSession({
      enrollmentId,
      courseId,
      entryId,
      version: launch.version,
      onCompleted: () => onCompleted?.(),
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
  }, [launch?.scorm_package_id, launch?.version]);

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
    <div className="flex flex-col gap-2">
      {!isReady && (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <iframe
        key={launch.scorm_package_id}
        title="Contenu SCORM"
        src={isReady ? launch.launch_url : undefined}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        className={`w-full h-[70vh] rounded-lg border border-slate-200 bg-white ${isReady ? '' : 'hidden'}`}
      />
    </div>
  );
}
