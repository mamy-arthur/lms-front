import { portalScormApi, type ScormVersion } from '@/shared/api/portal-scorm.api';
import { ScormPreviewSession, getScormPreviewLaunchUrl } from '../scormPreviewRuntime';

jest.mock('@/shared/api/portal-scorm.api', () => ({
  portalScormApi: {
    launch: jest.fn(),
    getTracking: jest.fn(),
    commitTracking: jest.fn(),
    getTrackingSequence: jest.fn(),
  },
}));

const pathId = '12345678-1234-4123-8123-123456789abc';
const entryId = '12345678-1234-4123-8123-123456789def';
const assetUrl = `/api/v1/role-simulation/training/learning-paths/${pathId}/entries/${entryId}/scorm/assets/payload.signature/index.html`;
const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch');
const originalBeacon = Object.getOwnPropertyDescriptor(navigator, 'sendBeacon');
const mockFetch = jest.fn();
const mockBeacon = jest.fn();
type RuntimeApi = Record<string, (...args: string[]) => string>;
const globals = window as unknown as Record<string, RuntimeApi | undefined>;

function apiFor(version: ScormVersion) {
  const api = globals[version === '1.2' ? 'API' : 'API_1484_11']!;
  const prefix = version === '1.2' ? 'LMS' : '';
  return {
    initialize: () => api[`${prefix}Initialize`](''),
    get: (key: string) => api[`${prefix}GetValue`](key),
    set: (key: string, value: string) => api[`${prefix}SetValue`](key, value),
    commit: () => api[`${prefix}Commit`](''),
    finish: () => api[version === '1.2' ? 'LMSFinish' : 'Terminate'](''),
    error: () => api[`${prefix}GetLastError`](),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  Object.defineProperty(global, 'fetch', { configurable: true, value: mockFetch });
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: mockBeacon });
  jest.spyOn(global, 'XMLHttpRequest');
  for (const method of ['getItem', 'setItem', 'removeItem', 'clear', 'key'] as const) {
    jest.spyOn(Storage.prototype, method);
  }
  jest.spyOn(global, 'setTimeout');
  jest.spyOn(global, 'setInterval');
});

afterEach(() => {
  // These assertions cover construction, all RTE calls, unload, disposal and remount.
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockBeacon).not.toHaveBeenCalled();
  expect(XMLHttpRequest).not.toHaveBeenCalled();
  for (const method of ['getItem', 'setItem', 'removeItem', 'clear', 'key'] as const) {
    expect(Storage.prototype[method]).not.toHaveBeenCalled();
  }
  for (const method of Object.values(portalScormApi)) expect(method).not.toHaveBeenCalled();
  expect(setTimeout).not.toHaveBeenCalled();
  expect(setInterval).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
  delete globals.API;
  delete globals.API_1484_11;
  jest.restoreAllMocks();
  jest.useRealTimers();
  if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch);
  else Reflect.deleteProperty(global, 'fetch');
  if (originalBeacon) Object.defineProperty(navigator, 'sendBeacon', originalBeacon);
  else Reflect.deleteProperty(navigator, 'sendBeacon');
});

describe.each<ScormVersion>(['1.2', '2004'])('ScormPreviewSession %s', (version) => {
  it('runs a complete synchronous SCO lifecycle only in RAM, then starts fresh on remount', () => {
    const session = new ScormPreviewSession(version);
    const dispose = session.bind(window);
    const api = apiFor(version);
    const core = version === '1.2' ? 'cmi.core.' : 'cmi.';
    expect(api.initialize()).toBe('true');
    expect(api.get(`${core}${version === '1.2' ? 'student_id' : 'learner_id'}`)).toBe(
      'preview-learner',
    );
    expect(api.get(`${core}${version === '1.2' ? 'student_name' : 'learner_name'}`)).toBe(
      'Apprenant de démonstration',
    );
    expect(api.get(`${core}${version === '1.2' ? 'lesson_mode' : 'mode'}`)).toBe('browse');
    expect(api.get(`${core}credit`)).toBe('no-credit');
    expect(api.get(`${core}entry`)).toBe('ab-initio');
    expect(api.get(`${core}${version === '1.2' ? 'lesson_location' : 'location'}`)).toBe('');
    expect(api.get('cmi.suspend_data')).toBe('');
    const zeroTime = version === '1.2' ? '0000:00:00.00' : 'PT0H0M0S';
    expect(api.get(`${core}total_time`)).toBe(zeroTime);
    expect(api.get('cmi.interactions._count')).toBe('0');

    const writes: [string, string][] = [
      [`${core}score.raw`, '98'],
      [`${core}score.min`, '0'],
      [`${core}score.max`, '100'],
      [`${core}${version === '1.2' ? 'lesson_status' : 'completion_status'}`, 'completed'],
      [`${core}session_time`, version === '1.2' ? '00:05:30' : 'PT5M30S'],
      ['cmi.suspend_data', '{"page":3}'],
      ['cmi.interactions.0.id', 'question-1'],
    ];
    if (version === '2004') writes.push(['cmi.success_status', 'passed']);
    for (const [key, value] of writes) {
      expect(api.set(key, value)).toBe('true');
      expect(api.get(key)).toBe(value);
    }
    expect(api.commit()).toBe('true');
    expect(api.commit()).toBe('true');
    expect(api.error()).toBe('0');
    expect(api.get(`${core}total_time`)).toBe(zeroTime);
    expect(api.finish()).toBe('true');
    window.dispatchEvent(new Event('beforeunload'));
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('unload'));
    dispose();
    dispose();
    expect(globals.API).toBeUndefined();
    expect(globals.API_1484_11).toBeUndefined();
    expect(api.initialize()).toBe('false');
    expect(api.get('cmi.suspend_data')).toBe('');
    expect(api.set('cmi.suspend_data', 'late write')).toBe('false');
    expect(api.commit()).toBe('false');

    const next = new ScormPreviewSession(version);
    const disposeNext = next.bind(window);
    const nextApi = apiFor(version);
    expect(nextApi.initialize()).toBe('true');
    expect(nextApi.get('cmi.suspend_data')).toBe('');
    expect(nextApi.get(`${core}score.raw`)).toBe('');
    expect(nextApi.get(`${core}total_time`)).toBe(zeroTime);
    expect(nextApi.get(`${core}${version === '1.2' ? 'lesson_status' : 'completion_status'}`)).toBe(
      version === '1.2' ? 'not attempted' : 'unknown',
    );
    disposeNext();
  });

  it('supports errors before initialization and protects fixed preview identity/mode', () => {
    const session = new ScormPreviewSession(version);
    expect(session.apiGetValue('cmi.suspend_data')).toBe('');
    expect(session.apiGetLastError()).toBe(version === '1.2' ? '301' : '122');
    expect(session.apiSetValue('cmi.suspend_data', 'resume')).toBe('false');
    expect(session.apiCommit()).toBe('false');
    expect(session.apiFinish()).toBe('false');
    expect(session.apiGetErrorString(session.apiGetLastError())).not.toBe('');
    expect(session.apiGetDiagnostic('')).not.toBe('');
    expect(session.apiGetErrorString('999')).toBe('');
    expect(session.apiInitialize()).toBe('true');
    expect(session.apiInitialize()).toBe('false');
    for (const [key, value] of [
      ['cmi.mode', 'browse'],
      ['cmi.core.lesson_mode', 'browse'],
      ['cmi.credit', 'no-credit'],
      ['cmi.core.credit', 'no-credit'],
      ['cmi.core.student_id', 'preview-learner'],
      ['cmi.learner_id', 'preview-learner'],
    ]) {
      expect(session.apiSetValue(key, 'spoofed')).toBe('false');
      expect(session.apiGetLastError()).toBe(version === '1.2' ? '403' : '404');
      expect(session.apiGetValue(key)).toBe(value);
    }
    expect(session.apiSetValue('location.href', 'https://example.test')).toBe('false');
    expect(session.apiGetValue('not.cmi')).toBe('');
    expect(session.apiGetLastError()).toBe('401');
    session.destroy();
  });

  it('clears unfinished sessions on teardown without deleting a newer window API', () => {
    const old = new ScormPreviewSession(version);
    const dispose = old.bind(window);
    const oldApi = apiFor(version);
    oldApi.initialize();
    oldApi.set('cmi.suspend_data', 'unfinished');
    const next = new ScormPreviewSession(version);
    const disposeNext = next.bind(window);
    dispose();
    expect(oldApi.get('cmi.suspend_data')).toBe('');
    expect(oldApi.finish()).toBe('false');
    const nextApi = apiFor(version);
    expect(nextApi.initialize()).toBe('true');
    expect(nextApi.get('cmi.suspend_data')).toBe('');
    disposeNext();
  });
});

describe('getScormPreviewLaunchUrl', () => {
  const origin = 'https://learneo.test';
  it.each([
    assetUrl,
    `${origin}${assetUrl}`,
    `${assetUrl}?lang=fr`,
    assetUrl.replace('index.html', 'le%C3%A7on%201.html'),
  ])('accepts only scoped same-origin asset URLs: %s', (url) => {
    expect(getScormPreviewLaunchUrl(url, origin)).toBe(url);
  });

  it.each([
    null,
    undefined,
    123,
    {},
    '',
    'javascript:alert(1)',
    'data:text/html,hello',
    'blob:https://learneo.test/id',
    `//learneo.test${assetUrl}`,
    `https://other.test${assetUrl}`,
    `https://learneo.test.evil.test${assetUrl}`,
    `http://learneo.test${assetUrl}`,
    `https://actor@learneo.test${assetUrl}`,
    `https://learneo.test:8443${assetUrl}`,
    `/api/v1/enrollments/id/scorm/assets/token/index.html?read_only=true`,
    assetUrl.replace('/training/', '/shop/'),
    assetUrl.replace('/assets/', '/launch/'),
    assetUrl.replace(pathId, 'not-a-uuid'),
    assetUrl.replace(entryId, 'not-an-entry'),
    assetUrl.replace(`/entries/${entryId}`, ''),
    assetUrl.replace('payload.signature', 'unsigned'),
    assetUrl.replace('index.html', ''),
    assetUrl.replace('index.html', '../index.html'),
    assetUrl.replace('index.html', '%2e%2e/index.html'),
    assetUrl.replace('index.html', '%252e%252e/index.html'),
    assetUrl.replace('index.html', '%2findex.html'),
    assetUrl.replace('index.html', '%5cindex.html'),
    assetUrl.replace('index.html', '%00index.html'),
    assetUrl.replace('index.html', 'bad%zz.html'),
    ` ${assetUrl}`,
    `${assetUrl}\n`,
    `${assetUrl}#injected`,
    assetUrl.replace('/index.html', '\\index.html'),
    assetUrl.slice(1),
    `/redirect?url=${assetUrl}`,
    `${assetUrl}//index.html`,
  ])('rejects malformed/external/injected URLs: %s', (url) => {
    expect(getScormPreviewLaunchUrl(url, origin)).toBeNull();
  });
});
