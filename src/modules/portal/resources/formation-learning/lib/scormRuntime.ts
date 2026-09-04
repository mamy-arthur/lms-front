import {
  portalScormApi,
  type ScormVersion,
  type ScormLessonStatus,
  type ApiScormTrackingState,
} from '@/shared/api/portal-scorm.api';

// ── SCORM error codes (minimal subset — enough for well-behaved packages) ──

const ERROR_NO_ERROR = '0';
const ERROR_GENERAL = '101';
const ERROR_NOT_INITIALIZED = '301';

const ERROR_STRINGS: Record<string, string> = {
  [ERROR_NO_ERROR]: 'No error',
  [ERROR_GENERAL]: 'General exception',
  [ERROR_NOT_INITIALIZED]: 'Not initialized',
};

// ── Time format helpers ─────────────────────────────────────────────────────

/** SCORM 1.2 CMITimespan: HH:MM:SS(.ss), hours may exceed 2 digits. */
function parseScorm12Time(value: string): number {
  const m = /^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(value.trim());
  if (!m) return 0;
  const [, h, minutes, seconds] = m;
  return Math.round(Number(h) * 3600 + Number(minutes) * 60 + Number(seconds));
}

function formatScorm12Time(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** SCORM 2004 uses ISO 8601 durations (PnDTnHnMnS). */
function parseIso8601Duration(value: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/.exec(value.trim());
  if (!m) return 0;
  const [, d, h, minutes, seconds] = m;
  return Math.round(
    (Number(d) || 0) * 86400 +
      (Number(h) || 0) * 3600 +
      (Number(minutes) || 0) * 60 +
      (Number(seconds) || 0),
  );
}

function formatIso8601Duration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `PT${Math.floor(s / 3600)}H${Math.floor((s % 3600) / 60)}M${s % 60}S`;
}

// ── SCORM 2004 completion/success ↔ unified lesson_status mapping ──────────

function splitLessonStatusFor2004(
  status: ScormLessonStatus,
): [completion: string, success: string] {
  switch (status) {
    case 'passed':
      return ['completed', 'passed'];
    case 'failed':
      return ['completed', 'failed'];
    case 'completed':
      return ['completed', 'unknown'];
    case 'incomplete':
    case 'browsed':
      return ['incomplete', 'unknown'];
    case 'not_attempted':
      return ['not attempted', 'unknown'];
    default:
      return ['unknown', 'unknown'];
  }
}

function combineScorm2004Status(completion: string, success: string): ScormLessonStatus {
  if (success === 'passed') return 'passed';
  if (success === 'failed') return 'failed';
  if (completion === 'completed') return 'completed';
  if (completion === 'not attempted') return 'not_attempted';
  if (completion === 'incomplete') return 'incomplete';
  return 'unknown';
}

export interface ScormSessionOptions {
  enrollmentId: string;
  courseId: string;
  entryId: string;
  version: ScormVersion;
  /** Called once, the first time a commit resolves to completed/passed. */
  onCompleted?: (status: ScormLessonStatus) => void;
}

/**
 * Bridges the SCORM 1.2 / 2004 Run-Time Environment API to the backend
 * tracking endpoints (API.md §22.10). GetValue/SetValue are pure in-memory
 * (spec requires them synchronous); Commit/Terminate fire the network call
 * in the background so the RTE calls can return immediately, matching how
 * real players behave — errors surface via GetLastError, not a thrown call.
 */
export class ScormSession {
  private readonly opts: ScormSessionOptions;
  private initialized = false;
  private lastErrorCode = ERROR_NO_ERROR;
  private lastSequence = 0;
  private baselineTotalTime = 0;
  private lessonStatus: ScormLessonStatus = 'not_attempted';
  private completionStatus = 'unknown';
  private successStatus = 'unknown';
  private scoreRaw: number | null = null;
  private scoreMin: number | null = null;
  private scoreMax: number | null = null;
  private sessionTimeSeconds = 0;
  /** Catch-all store for cmi.* elements not explicitly modeled above. */
  private raw: Record<string, string> = {};
  private dirty = false;
  private hasNotifiedCompletion = false;
  private commitChain: Promise<void> = Promise.resolve();

  constructor(opts: ScormSessionOptions) {
    this.opts = opts;
  }

  /** Fetches the current tracking state. Must resolve before the iframe is mounted. */
  async preload(): Promise<boolean> {
    try {
      const { data } = await portalScormApi.getTracking(
        this.opts.enrollmentId,
        this.opts.courseId,
        this.opts.entryId,
      );
      this.applyServerState(data);
      // Already completed in a previous session — don't re-notify on the next commit.
      if (this.lessonStatus === 'completed' || this.lessonStatus === 'passed') {
        this.hasNotifiedCompletion = true;
      }
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private applyServerState(data: ApiScormTrackingState): void {
    this.lastSequence = data.last_sequence ?? 0;
    this.baselineTotalTime = data.total_time ?? 0;
    this.lessonStatus = data.lesson_status;
    if (this.opts.version === '2004') {
      [this.completionStatus, this.successStatus] = splitLessonStatusFor2004(data.lesson_status);
    }
    this.scoreRaw = data.score_raw;
    this.scoreMin = data.score_min;
    this.scoreMax = data.score_max;
    for (const [key, value] of Object.entries(data.cmi_data ?? {})) {
      this.raw[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
  }

  // ── RTE lifecycle (sync, called from window.API / window.API_1484_11) ──

  apiInitialize(): string {
    if (!this.initialized) {
      this.lastErrorCode = ERROR_GENERAL;
      return 'false';
    }
    this.lastErrorCode = ERROR_NO_ERROR;
    return 'true';
  }

  apiFinish(): string {
    if (!this.initialized) {
      this.lastErrorCode = ERROR_NOT_INITIALIZED;
      return 'false';
    }
    if (this.dirty) this.queueCommit();
    this.lastErrorCode = ERROR_NO_ERROR;
    return 'true';
  }

  apiGetValue(name: string): string {
    if (!this.initialized) {
      this.lastErrorCode = ERROR_NOT_INITIALIZED;
      return '';
    }
    this.lastErrorCode = ERROR_NO_ERROR;
    switch (name) {
      case 'cmi.core.lesson_status':
        return this.lessonStatus === 'not_attempted' ? 'not attempted' : this.lessonStatus;
      case 'cmi.completion_status':
        return this.completionStatus;
      case 'cmi.success_status':
        return this.successStatus;
      case 'cmi.core.score.raw':
      case 'cmi.score.raw':
        return this.scoreRaw != null ? String(this.scoreRaw) : '';
      case 'cmi.core.score.min':
      case 'cmi.score.min':
        return this.scoreMin != null ? String(this.scoreMin) : '';
      case 'cmi.core.score.max':
      case 'cmi.score.max':
        return this.scoreMax != null ? String(this.scoreMax) : '';
      case 'cmi.core.total_time':
        return formatScorm12Time(this.baselineTotalTime);
      case 'cmi.total_time':
        return formatIso8601Duration(this.baselineTotalTime);
      case 'cmi.core.credit':
      case 'cmi.credit':
        return 'credit';
      case 'cmi.core.lesson_mode':
      case 'cmi.mode':
        return 'normal';
      case 'cmi.core.entry':
      case 'cmi.entry':
        return this.baselineTotalTime > 0 ? 'resume' : 'ab-initio';
      default:
        return this.raw[name] ?? '';
    }
  }

  apiSetValue(name: string, value: string): string {
    if (!this.initialized) {
      this.lastErrorCode = ERROR_NOT_INITIALIZED;
      return 'false';
    }
    this.dirty = true;
    this.lastErrorCode = ERROR_NO_ERROR;
    switch (name) {
      case 'cmi.core.lesson_status':
        this.lessonStatus = value.replace(' ', '_') as ScormLessonStatus;
        break;
      case 'cmi.completion_status':
        this.completionStatus = value;
        this.lessonStatus = combineScorm2004Status(this.completionStatus, this.successStatus);
        break;
      case 'cmi.success_status':
        this.successStatus = value;
        this.lessonStatus = combineScorm2004Status(this.completionStatus, this.successStatus);
        break;
      case 'cmi.core.score.raw':
      case 'cmi.score.raw':
        this.scoreRaw = value === '' ? null : Number(value);
        break;
      case 'cmi.core.score.min':
      case 'cmi.score.min':
        this.scoreMin = value === '' ? null : Number(value);
        break;
      case 'cmi.core.score.max':
      case 'cmi.score.max':
        this.scoreMax = value === '' ? null : Number(value);
        break;
      case 'cmi.score.scaled': {
        const scaled = Number(value);
        if (!Number.isNaN(scaled) && this.scoreRaw == null) {
          this.scoreMin = 0;
          this.scoreMax = 100;
          this.scoreRaw = Math.round(scaled * 100);
        }
        this.raw[name] = value;
        break;
      }
      case 'cmi.core.session_time':
        this.sessionTimeSeconds = parseScorm12Time(value);
        break;
      case 'cmi.session_time':
        this.sessionTimeSeconds = parseIso8601Duration(value);
        break;
      default:
        this.raw[name] = value;
    }
    return 'true';
  }

  apiCommit(): string {
    if (!this.initialized) {
      this.lastErrorCode = ERROR_NOT_INITIALIZED;
      return 'false';
    }
    this.queueCommit();
    this.lastErrorCode = ERROR_NO_ERROR;
    return 'true';
  }

  apiGetLastError(): string {
    return this.lastErrorCode;
  }

  apiGetErrorString(code: string): string {
    return ERROR_STRINGS[code] ?? '';
  }

  apiGetDiagnostic(code: string): string {
    return ERROR_STRINGS[code] ?? '';
  }

  /** Serializes commits so retries/sequence corrections never race each other. */
  private queueCommit(): void {
    this.commitChain = this.commitChain.then(() => this.commit());
  }

  private async commit(): Promise<void> {
    if (!this.dirty) return;
    const payload = () => ({
      commit_id: crypto.randomUUID(),
      sequence: this.lastSequence + 1,
      lesson_status: this.lessonStatus,
      ...(this.scoreRaw != null ? { score_raw: this.scoreRaw } : {}),
      ...(this.scoreMin != null ? { score_min: this.scoreMin } : {}),
      ...(this.scoreMax != null ? { score_max: this.scoreMax } : {}),
      session_time: this.sessionTimeSeconds,
      total_time: this.baselineTotalTime + this.sessionTimeSeconds,
      cmi_data: this.raw,
    });

    try {
      const { data } = await portalScormApi.commitTracking(
        this.opts.enrollmentId,
        this.opts.courseId,
        this.opts.entryId,
        payload(),
      );
      this.applyServerState(data);
      this.dirty = false;
      this.notifyIfCompleted();
    } catch (err) {
      const status = (err as { status?: number } | undefined)?.status;
      if (status !== 409 && status !== 422) return;
      // Sequence drifted — resync then retry once with the corrected sequence.
      try {
        const { data: seq } = await portalScormApi.getTrackingSequence(
          this.opts.enrollmentId,
          this.opts.courseId,
          this.opts.entryId,
        );
        this.lastSequence = seq.last_sequence;
        const { data } = await portalScormApi.commitTracking(
          this.opts.enrollmentId,
          this.opts.courseId,
          this.opts.entryId,
          payload(),
        );
        this.applyServerState(data);
        this.dirty = false;
        this.notifyIfCompleted();
      } catch {
        // Give up silently for this commit — the next one will retry from scratch.
      }
    }
  }

  private notifyIfCompleted(): void {
    if (this.hasNotifiedCompletion) return;
    if (this.lessonStatus === 'completed' || this.lessonStatus === 'passed') {
      this.hasNotifiedCompletion = true;
      this.opts.onCompleted?.(this.lessonStatus);
    }
  }
}

/** SCORM element/method names the RTE object exposes, per version. */
export function bindScormWindowApi(
  win: Window,
  session: ScormSession,
  version: ScormVersion,
): () => void {
  const globalWindow = win as unknown as Record<string, unknown>;
  const propertyName = version === '2004' ? 'API_1484_11' : 'API';

  const api =
    version === '2004'
      ? {
          Initialize: () => session.apiInitialize(),
          Terminate: () => session.apiFinish(),
          GetValue: (name: string) => session.apiGetValue(name),
          SetValue: (name: string, value: string) => session.apiSetValue(name, value),
          Commit: () => session.apiCommit(),
          GetLastError: () => session.apiGetLastError(),
          GetErrorString: (code: string) => session.apiGetErrorString(code),
          GetDiagnostic: (code: string) => session.apiGetDiagnostic(code),
        }
      : {
          LMSInitialize: () => session.apiInitialize(),
          LMSFinish: () => session.apiFinish(),
          LMSGetValue: (name: string) => session.apiGetValue(name),
          LMSSetValue: (name: string, value: string) => session.apiSetValue(name, value),
          LMSCommit: () => session.apiCommit(),
          LMSGetLastError: () => session.apiGetLastError(),
          LMSGetErrorString: (code: string) => session.apiGetErrorString(code),
          LMSGetDiagnostic: (code: string) => session.apiGetDiagnostic(code),
        };

  globalWindow[propertyName] = api;
  return () => {
    delete globalWindow[propertyName];
  };
}
