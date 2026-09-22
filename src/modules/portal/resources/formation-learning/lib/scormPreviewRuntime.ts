import type { ScormVersion } from '@/shared/api/portal-scorm.api';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ASSET_PATH = new RegExp(
  `^/api/v1/role-simulation/training/learning-paths/${UUID}/entries/${UUID}/scorm/assets/[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+/.+$`,
  'i',
);

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

/** Validate before assigning an executable iframe URL; never infer preview from a query. */
export function getScormPreviewLaunchUrl(value: unknown, origin: string): string | null {
  if (
    typeof value !== 'string' ||
    !value ||
    /[\s\\]/.test(value) ||
    hasControlCharacters(value) ||
    value.startsWith('//')
  )
    return null;
  // Only root-relative or absolute HTTP(S) URLs, not relative paths or executable schemes.
  if (!value.startsWith('/') && !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      url.hash ||
      !ASSET_PATH.test(url.pathname)
    )
      return null;

    // Inspect the original path too: URL() normalizes dot segments before validation.
    const path = value.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/, 1)[0];
    if (
      path
        .split('/')
        .slice(1)
        .some((part) => {
          const decoded = decodeURIComponent(part);
          return (
            !decoded ||
            decoded === '.' ||
            decoded === '..' ||
            /[/\\%]/.test(decoded) ||
            hasControlCharacters(decoded)
          );
        })
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

const FIXED_VALUES: Readonly<Record<string, string>> = {
  'cmi.core.student_id': 'preview-learner',
  'cmi.core.student_name': 'Apprenant de démonstration',
  'cmi.learner_id': 'preview-learner',
  'cmi.learner_name': 'Apprenant de démonstration',
  'cmi.core.lesson_mode': 'browse',
  'cmi.mode': 'browse',
  'cmi.core.credit': 'no-credit',
  'cmi.credit': 'no-credit',
  'cmi.core.entry': 'ab-initio',
  'cmi.entry': 'ab-initio',
  'cmi.core.total_time': '0000:00:00.00',
  'cmi.total_time': 'PT0H0M0S',
  'cmi.launch_data': '',
  'cmi._version': '1.0',
  'cmi.core._children':
    'student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time',
  'cmi.core.score._children': 'raw,min,max',
  'cmi.score._children': 'scaled,raw,min,max',
};

const DEFAULT_VALUES: Readonly<Record<string, string>> = {
  'cmi.core.lesson_status': 'not attempted',
  'cmi.completion_status': 'unknown',
  'cmi.success_status': 'unknown',
  'cmi.core.lesson_location': '',
  'cmi.location': '',
  'cmi.suspend_data': '',
  'cmi.core.session_time': '0000:00:00.00',
  'cmi.session_time': 'PT0H0M0S',
  'cmi.student_preference.audio': '0',
  'cmi.student_preference.language': '',
  'cmi.student_preference.speed': '0',
  'cmi.student_preference.text': '0',
  'cmi.learner_preference.audio_level': '1',
  'cmi.learner_preference.language': '',
  'cmi.learner_preference.delivery_speed': '1',
  'cmi.learner_preference.audio_captioning': '0',
};

const ERROR_STRINGS: Readonly<Record<string, string>> = {
  '0': 'No error',
  '101': 'General exception',
  '103': 'Already initialized',
  '104': 'Content instance terminated',
  '112': 'Termination before initialization',
  '113': 'Termination after termination',
  '122': 'Retrieve data before initialization',
  '123': 'Retrieve data after termination',
  '132': 'Store data before initialization',
  '133': 'Store data after termination',
  '142': 'Commit before initialization',
  '143': 'Commit after termination',
  '301': 'Not initialized',
  '401': 'Undefined data model element',
  '403': 'Element is read only',
  '404': 'Element is read only',
};

/**
 * Synchronous, disposable SCORM compatibility adapter for read-only previews.
 * No learner context, completion callback, tracking client, preload, persistence,
 * queued work or timers. Package writes exist only in this instance's RAM.
 * This is not an isolation boundary for hostile same-origin package scripts.
 */
export class ScormPreviewSession {
  private initialized = false;
  private terminated = false;
  private lastError = '0';
  private readonly values = new Map<string, string>();
  private detach?: () => void;

  constructor(private readonly version: ScormVersion) {}

  private fail(code: string, result = 'false'): string {
    this.lastError = code;
    return result;
  }

  private active(before: string, after: string): boolean {
    if (this.initialized && !this.terminated) return true;
    this.lastError = this.version === '1.2' ? '301' : this.terminated ? after : before;
    return false;
  }

  apiInitialize(): string {
    if (this.terminated) return this.fail(this.version === '1.2' ? '101' : '104');
    if (this.initialized) return this.fail(this.version === '1.2' ? '101' : '103');
    this.initialized = true;
    this.lastError = '0';
    return 'true';
  }

  apiGetValue(name: string): string {
    if (!this.active('122', '123')) return '';
    if (!name.startsWith('cmi.')) return this.fail('401', '');
    this.lastError = '0';
    return (
      FIXED_VALUES[name] ??
      this.values.get(name) ??
      DEFAULT_VALUES[name] ??
      (name.endsWith('._count') ? '0' : '')
    );
  }

  apiSetValue(name: string, value: string): string {
    if (!this.active('132', '133')) return 'false';
    if (!name.startsWith('cmi.')) return this.fail('401');
    if (Object.hasOwn(FIXED_VALUES, name)) return this.fail(this.version === '1.2' ? '403' : '404');
    this.values.set(name, String(value));
    this.lastError = '0';
    return 'true';
  }

  apiCommit(): string {
    if (!this.active('142', '143')) return 'false';
    this.lastError = '0';
    return 'true';
  }

  apiFinish(): string {
    if (!this.active('112', '113')) return 'false';
    this.values.clear();
    this.initialized = false;
    this.terminated = true;
    this.lastError = '0';
    return 'true';
  }

  apiGetLastError(): string {
    return this.lastError;
  }
  apiGetErrorString(code: string): string {
    return ERROR_STRINGS[code] ?? '';
  }
  apiGetDiagnostic(code: string): string {
    return this.apiGetErrorString(code || this.lastError);
  }

  /** Install synchronously BEFORE setting iframe src. Cleanup also discards all CMI. */
  bind(win: Window): () => void {
    this.detach?.();
    const target = win as unknown as Record<string, unknown>;
    const property = this.version === '2004' ? 'API_1484_11' : 'API';
    const api =
      this.version === '2004'
        ? {
            Initialize: () => this.apiInitialize(),
            GetValue: (name: string) => this.apiGetValue(name),
            SetValue: (name: string, value: string) => this.apiSetValue(name, value),
            Commit: () => this.apiCommit(),
            Terminate: () => this.apiFinish(),
            GetLastError: () => this.apiGetLastError(),
            GetErrorString: (code: string) => this.apiGetErrorString(code),
            GetDiagnostic: (code: string) => this.apiGetDiagnostic(code),
          }
        : {
            LMSInitialize: () => this.apiInitialize(),
            LMSGetValue: (name: string) => this.apiGetValue(name),
            LMSSetValue: (name: string, value: string) => this.apiSetValue(name, value),
            LMSCommit: () => this.apiCommit(),
            LMSFinish: () => this.apiFinish(),
            LMSGetLastError: () => this.apiGetLastError(),
            LMSGetErrorString: (code: string) => this.apiGetErrorString(code),
            LMSGetDiagnostic: (code: string) => this.apiGetDiagnostic(code),
          };
    target[property] = api;
    this.detach = () => {
      if (target[property] === api) delete target[property];
    };
    return () => this.destroy();
  }

  /** Invalidate retained API references as well as removing the window property. */
  destroy(): void {
    this.values.clear();
    this.initialized = false;
    this.terminated = true;
    this.lastError = '0';
    this.detach?.();
    this.detach = undefined;
  }
}
