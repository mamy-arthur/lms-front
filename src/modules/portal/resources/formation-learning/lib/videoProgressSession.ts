import {
  portalVideoApi,
  type VideoProgressContext,
  type VideoProgressPayload,
  type WatchedRange,
} from '@/shared/api/portal-video.api';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';
import { selectSessionIdentity, useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import { clearVideoDraft, readVideoDraft, writeVideoDraft } from './videoProgressStorage';

export type RegisterVideoSession = (session: VideoProgressSession) => () => void;
export type VideoSaveStatus = 'loading' | 'ready' | 'retrying' | 'conflict';

export function videoTrackingAllowed(): boolean {
  const auth = useAuthStore.getState();
  const phase = useSimulationStore.getState().phase;
  return !!auth.user && !auth.simulatedRole && (phase === 'idle' || phase === 'ready');
}

export function mergeWatchedRanges(ranges: WatchedRange[]): WatchedRange[] {
  const merged: WatchedRange[] = [];
  for (const [start, end] of [...ranges].sort((a, b) => a[0] - b[0])) {
    if (end <= start) continue;
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/** Native video only. Position and watched coverage are deliberately independent. */
export class VideoProgressSession {
  private readonly identity = selectSessionIdentity(useAuthStore.getState());
  private readonly tenant = useTenantStore.getState().tenant?.id ?? null;
  private readonly epoch = useSimulationStore.getState().epoch;
  private readonly storageKey: string;
  private loaded = false;
  private loading: Promise<void> | null = null;
  private completion: Promise<void> | null = null;
  private completing = false;
  private frozen = false;
  private disposed = false;
  private revoked = false;
  private stopped = false;
  private interacted = false;
  private resumePosition: number | null = null;
  private version = 0;
  private position = 0;
  private duration = 0;
  private ranges: WatchedRange[] = [];
  private dirty = false;
  private generation = 0;
  private pending: VideoProgressPayload | null = null;
  private sending: Promise<void> | null = null;
  private playing = false;
  private baseline: { time: number; wall: number; rate: number } | null = null;
  private readonly controllers = new Set<AbortController>();
  private readonly cleanups: Array<() => void> = [];

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly context: VideoProgressContext,
    private execution: ExecutionMutationContext | null,
    private readonly readOnly: boolean,
    private readonly onStatus: (status: VideoSaveStatus) => void,
  ) {
    this.storageKey = JSON.stringify([
      this.tenant,
      useAuthStore.getState().user?.id,
      context.enrollmentId,
      context.competencyId,
      context.nodeExecutionId,
      context.courseId,
      context.entryId,
      context.mediaId,
    ]);
  }

  updateExecution(execution: ExecutionMutationContext | null) {
    this.execution = execution;
  }

  private allowed(): boolean {
    return (
      !this.revoked &&
      videoTrackingAllowed() &&
      selectSessionIdentity(useAuthStore.getState()) === this.identity &&
      (useTenantStore.getState().tenant?.id ?? null) === this.tenant &&
      useSimulationStore.getState().epoch === this.epoch
    );
  }

  private writable(): boolean {
    return (
      this.allowed() &&
      !this.readOnly &&
      !this.stopped &&
      !this.frozen &&
      this.execution?.node_execution_id === this.context.nodeExecutionId
    );
  }
  private status(status: VideoSaveStatus) {
    if (!this.disposed && this.allowed()) this.onStatus(status);
  }

  start(): void {
    if (!this.allowed()) return;
    this.status('loading');
    const revoke = () => {
      if (this.allowed()) return;
      this.revoked = true;
      this.baseline = null;
      this.controllers.forEach((controller) => controller.abort());
    };
    this.cleanups.push(
      useAuthStore.subscribe(revoke),
      useTenantStore.subscribe(revoke),
      useSimulationStore.subscribe(revoke),
    );
    const listen = (target: EventTarget, type: string, listener: () => void) => {
      target.addEventListener(type, listener);
      this.cleanups.push(() => target.removeEventListener(type, listener));
    };
    listen(this.video, 'loadedmetadata', () => this.restore());
    listen(this.video, 'play', () => {
      if (this.completing) {
        this.video.pause();
        return;
      }
      this.interacted = true;
    });
    listen(this.video, 'playing', () => {
      this.playing = true;
      this.resetBaseline();
    });
    listen(this.video, 'timeupdate', () => this.sample());
    listen(this.video, 'pause', () => {
      this.sample();
      this.playing = false;
      this.baseline = null;
      void this.flush();
    });
    listen(this.video, 'ended', () => {
      this.sample();
      this.playing = false;
      this.baseline = null;
      void this.flush();
    });
    listen(this.video, 'waiting', () => {
      this.sample();
      this.playing = false;
      this.baseline = null;
    });
    listen(this.video, 'seeking', () => {
      this.interacted = true;
      this.baseline = null;
    });
    listen(this.video, 'seeked', () => {
      this.capturePosition();
      this.resetBaseline();
      void this.flush();
    });
    listen(this.video, 'ratechange', () => {
      this.sample();
      this.resetBaseline();
    });
    listen(document, 'visibilitychange', () => {
      this.baseline = null;
      if (document.visibilityState === 'hidden') void this.flush(true);
      else this.resetBaseline();
    });
    listen(window, 'pagehide', () => {
      this.sample();
      this.baseline = null;
      void this.flush(true);
    });
    listen(window, 'pageshow', () => this.resetBaseline());
    listen(window, 'online', () => {
      if (!this.loaded) void this.load();
      else void this.flush();
    });
    const sampleTimer = setInterval(() => this.sample(), 1000);
    const saveTimer = setInterval(() => {
      if (!this.loaded) void this.load();
      else void this.flush();
    }, 10_000);
    this.cleanups.push(
      () => clearInterval(sampleTimer),
      () => clearInterval(saveTimer),
    );
    void this.load();
  }

  private async request<T>(call: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    this.controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      return await call(controller.signal);
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(controller);
    }
  }

  private load(): Promise<void> {
    if (this.loading) return this.loading;
    if (this.loaded || this.disposed || this.stopped || !this.allowed()) return Promise.resolve();
    this.loading = this.loadProgress().finally(() => {
      this.loading = null;
    });
    return this.loading;
  }

  private async loadProgress(): Promise<void> {
    try {
      const saved = await this.request((signal) => portalVideoApi.get(this.context, signal));
      if (!this.allowed()) return;
      if (!this.matchesVisit(saved)) {
        this.failed({ status: 409 });
        return;
      }
      this.version = saved.version;
      this.loaded = true;
      const draft = !this.readOnly ? readVideoDraft(this.storageKey) : undefined;
      const canRecover =
        draft &&
        (draft.version === saved.version ||
          (draft.version + 1 === saved.version && draft.pendingCommitId === saved.last_commit_id));
      // Recover coverage even if the learner has already started a new playback.
      // Only the bookmark must yield to their more recent interaction.
      if (canRecover) {
        this.ranges = mergeWatchedRanges([...draft.ranges, ...this.ranges]).slice(0, 512);
        this.dirty = true;
        if (!this.duration) this.duration = draft.duration;
      }
      if (!this.interacted) {
        this.position = canRecover ? draft.position : saved.position;
        this.resumePosition = this.position;
        this.restore();
      }
      if (draft && !canRecover) clearVideoDraft(this.storageKey, draft.pendingCommitId);
      this.status('ready');
      // A late GET can still save the snapshot captured before unmount, but must
      // never read or seek a DOM element now owned by a different content.
      if (this.dirty) await this.flush(this.disposed);
    } catch (error) {
      this.failed(error);
    }
  }

  private restore(): void {
    if (
      this.disposed ||
      !this.allowed() ||
      this.interacted ||
      this.resumePosition === null ||
      !Number.isFinite(this.video.duration)
    )
      return;
    const position = Math.min(this.resumePosition, this.video.duration);
    this.resumePosition = null;
    this.video.currentTime = position;
    this.position = position;
    this.baseline = null;
  }

  private matchesVisit(progress: { node_id: string; node_execution_id: string }): boolean {
    return (
      progress.node_id === this.context.competencyId &&
      progress.node_execution_id === this.context.nodeExecutionId
    );
  }

  private resetBaseline(): void {
    this.baseline =
      !this.disposed &&
      !this.completing &&
      this.playing &&
      !this.video.paused &&
      !this.video.seeking &&
      document.visibilityState !== 'hidden'
        ? { time: this.video.currentTime, wall: performance.now(), rate: this.video.playbackRate }
        : null;
  }

  private capturePosition(): void {
    if (
      this.disposed ||
      !this.writable() ||
      !Number.isFinite(this.video.duration) ||
      this.video.duration <= 0 ||
      this.video.duration > 604800
    )
      return;
    const position = Math.max(0, Math.min(this.video.currentTime, this.video.duration));
    if (!Number.isFinite(position)) return;
    this.duration = this.video.duration;
    if (position !== this.position) {
      this.dirty = true;
      this.generation++;
    }
    this.position = position;
    this.remember();
  }

  private sample(): void {
    if (this.disposed || !this.writable()) return;
    if (
      !Number.isFinite(this.video.duration) ||
      this.video.duration <= 0 ||
      this.video.duration > 604800
    ) {
      this.baseline = null;
      return;
    }
    const previous = this.baseline;
    const time = this.video.currentTime;
    const elapsed = previous ? (performance.now() - previous.wall) / 1000 : 0;
    // Wall-clock bound rejects jumps even if the browser missed a seeking event.
    // Never bridge a pause, buffering, hidden tab, seek, or a long suspended timer.
    if (
      previous &&
      this.playing &&
      !this.video.seeking &&
      this.video.readyState >= 2 &&
      document.visibilityState !== 'hidden' &&
      elapsed > 0 &&
      elapsed <= 2.5 &&
      previous.time >= 0 &&
      time <= this.video.duration &&
      time > previous.time &&
      time - previous.time <= elapsed * previous.rate + 0.25
    ) {
      this.ranges = mergeWatchedRanges([...this.ranges, [previous.time, time]]).slice(0, 512);
      this.dirty = true;
      this.generation++;
    }
    this.capturePosition();
    this.resetBaseline();
  }

  private remember(): void {
    if (!this.loaded || !this.dirty || !this.writable() || this.duration <= 0) return;
    writeVideoDraft(this.storageKey, {
      position: this.position,
      duration: this.duration,
      ranges: this.ranges.slice(0, 512),
      version: this.version,
      pendingCommitId: this.pending?.commit_id ?? null,
      updatedAt: Date.now(),
    });
  }

  restart(): void {
    if (this.completing || this.disposed) return;
    this.interacted = true;
    this.resumePosition = null;
    this.baseline = null;
    this.video.currentTime = 0;
    this.capturePosition();
    // Zero must be persisted even when no timeupdate event is emitted.
    if (this.writable()) {
      this.dirty = true;
      this.generation++;
      void this.flush();
    }
  }

  seekBy(seconds: number): void {
    const { currentTime, duration } = this.video;
    if (
      this.completing ||
      this.disposed ||
      !Number.isFinite(seconds) ||
      !Number.isFinite(currentTime) ||
      !Number.isFinite(duration) ||
      duration <= 0
    )
      return;
    // Keep the coverage before the jump, but never credit the skipped interval.
    // Mark interaction now so a slow initial GET cannot undo the button click.
    this.sample();
    this.interacted = true;
    this.resumePosition = null;
    this.baseline = null;
    this.video.currentTime = Math.max(0, Math.min(currentTime + seconds, duration));
    this.capturePosition();
    void this.flush();
  }

  prepareCompletion(): Promise<void> {
    if (this.completion) return this.completion;
    this.completing = true;
    this.video.pause();
    this.completion = (async () => {
      if (!this.loaded) await this.load();
      await this.flush(); // Bookmark errors never change the manual completion policy.
      this.frozen = true;
    })();
    return this.completion;
  }

  resumeAfterFailure(): void {
    this.completing = false;
    this.frozen = false;
    this.completion = null;
    this.resetBaseline();
  }

  flush(keepalive = false): Promise<void> {
    this.sample();
    this.capturePosition();
    if (!this.loaded || !this.writable() || !this.dirty || this.duration <= 0)
      return Promise.resolve();
    if (this.sending) return this.sending;
    this.sending = this.send(keepalive).finally(() => {
      this.sending = null;
    });
    return this.sending;
  }

  private async send(keepalive: boolean): Promise<void> {
    // Serialize requests: a late periodic save must not undo a newer backward seek.
    while (this.dirty && this.writable() && this.execution) {
      const generation = this.generation;
      this.pending ??= {
        ...this.execution,
        competency_id: this.context.competencyId,
        position: this.position,
        duration: this.duration,
        watched_ranges: this.ranges.slice(0, 512),
        version: this.version,
        commit_id: crypto.randomUUID(),
      };
      const payload = this.pending;
      this.remember();
      try {
        const result = await this.request((signal) =>
          portalVideoApi.save(this.context, payload, signal, keepalive),
        );
        if (!this.allowed()) return;
        if (!this.matchesVisit(result)) {
          this.failed({ status: 409 });
          return;
        }
        this.version = result.version;
        this.pending = null;
        // A retry may acknowledge an older payload than the latest local draft.
        const unchanged =
          generation === this.generation &&
          payload.position === this.position &&
          JSON.stringify(payload.watched_ranges) === JSON.stringify(this.ranges);
        this.dirty = !unchanged;
        if (unchanged) {
          this.ranges = [];
          clearVideoDraft(this.storageKey, payload.commit_id);
        } else this.remember();
        this.status('ready');
      } catch (error) {
        this.failed(error);
        return;
      }
    }
  }

  private failed(error: unknown): void {
    if (!this.allowed()) return;
    const status = (error as { status?: number })?.status;
    if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
      this.stopped = true;
      clearVideoDraft(this.storageKey, this.pending?.commit_id ?? null);
      this.status('conflict');
    } else this.status('retrying');
  }

  dispose(): void {
    if (this.disposed) return;
    this.sample();
    void this.flush(true);
    this.disposed = true;
    this.cleanups.splice(0).forEach((cleanup) => cleanup());
  }
}
