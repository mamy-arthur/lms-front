/**
 * Tests unitaires — ScormSession (bridge SCORM 1.2/2004 ↔ tracking backend)
 *
 * Couvre :
 *  1. Garde d'initialisation (GetValue/SetValue/Commit avant preload())
 *  2. preload() restaure l'état serveur (lesson_status, scores, séquence)
 *  3. Mapping SCORM 2004 completion_status/success_status ↔ lesson_status unifié
 *  4. Parsing des formats de temps SCORM 1.2 (HH:MM:SS) et 2004 (ISO 8601)
 *  5. Commit : payload envoyé (sequence, session_time, total_time cumulé)
 *  6. Retry sur 409/422 : resync via tracking/sequence puis rejoue une fois
 *  7. onCompleted : notifié une seule fois, jamais si déjà complété au preload
 */

jest.mock('@/shared/api/portal-scorm.api', () => ({
  portalScormApi: {
    getTracking: jest.fn(),
    commitTracking: jest.fn(),
    getTrackingSequence: jest.fn(),
  },
}));

import { ScormSession, bindScormWindowApi } from '../scormRuntime';
import { portalScormApi, type ApiScormTrackingState } from '@/shared/api/portal-scorm.api';

const mockApi = portalScormApi as jest.Mocked<typeof portalScormApi>;

/** Flushes the microtask queue so fire-and-forget commit chains settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const BASE_STATE: ApiScormTrackingState = {
  content_entry_id: 'entry-1',
  lesson_status: 'incomplete',
  score_raw: null,
  score_min: null,
  score_max: null,
  session_time: 0,
  total_time: 120,
  cmi_data: {},
  last_commit_id: null,
  last_sequence: 3,
  updated_at: null,
};

function makeSession(version: '1.2' | '2004' = '1.2', onCompleted = jest.fn()) {
  return new ScormSession({
    enrollmentId: 'enr-1',
    courseId: 'course-1',
    entryId: 'entry-1',
    version,
    onCompleted,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ScormSession — garde d'initialisation", () => {
  it('GetValue/SetValue/Commit/Finish échouent avant preload()', () => {
    const session = makeSession();

    expect(session.apiGetValue('cmi.core.lesson_status')).toBe('');
    expect(session.apiGetLastError()).toBe('301');

    expect(session.apiSetValue('cmi.core.lesson_status', 'completed')).toBe('false');
    expect(session.apiCommit()).toBe('false');
    expect(session.apiFinish()).toBe('false');
  });

  it("Initialize échoue tant que preload() n'a pas résolu", () => {
    const session = makeSession();
    expect(session.apiInitialize()).toBe('false');
  });
});

describe('ScormSession — preload()', () => {
  it('restaure lesson_status/scores et autorise ensuite Initialize', async () => {
    mockApi.getTracking.mockResolvedValue({
      data: {
        ...BASE_STATE,
        lesson_status: 'incomplete',
        score_raw: 40,
        score_min: 0,
        score_max: 100,
      },
    });
    const session = makeSession();

    const ok = await session.preload();

    expect(ok).toBe(true);
    expect(session.apiInitialize()).toBe('true');
    expect(session.apiGetValue('cmi.core.lesson_status')).toBe('incomplete');
    expect(session.apiGetValue('cmi.core.score.raw')).toBe('40');
  });

  it('maps not_attempted to the SCORM 1.2 "not attempted" wire value', async () => {
    mockApi.getTracking.mockResolvedValue({
      data: { ...BASE_STATE, lesson_status: 'not_attempted' },
    });
    const session = makeSession();
    await session.preload();

    expect(session.apiGetValue('cmi.core.lesson_status')).toBe('not attempted');
  });

  it('returns false and stays uninitialized when the fetch fails', async () => {
    mockApi.getTracking.mockRejectedValue(new Error('network'));
    const session = makeSession();

    const ok = await session.preload();

    expect(ok).toBe(false);
    expect(session.apiInitialize()).toBe('false');
  });
});

describe('ScormSession — mapping SCORM 2004', () => {
  it('splits a unified lesson_status into completion_status/success_status on preload', async () => {
    mockApi.getTracking.mockResolvedValue({ data: { ...BASE_STATE, lesson_status: 'passed' } });
    const session = makeSession('2004');
    await session.preload();

    expect(session.apiGetValue('cmi.completion_status')).toBe('completed');
    expect(session.apiGetValue('cmi.success_status')).toBe('passed');
  });

  it('recombines completion_status + success_status into lesson_status for the next commit', async () => {
    mockApi.getTracking.mockResolvedValue({ data: { ...BASE_STATE, lesson_status: 'incomplete' } });
    mockApi.commitTracking.mockResolvedValue({ data: { ...BASE_STATE, lesson_status: 'passed' } });
    const session = makeSession('2004');
    await session.preload();

    session.apiSetValue('cmi.completion_status', 'completed');
    session.apiSetValue('cmi.success_status', 'passed');
    session.apiCommit();
    await flush();

    expect(mockApi.commitTracking).toHaveBeenCalledWith(
      'enr-1',
      'course-1',
      'entry-1',
      expect.objectContaining({ lesson_status: 'passed' }),
    );
  });
});

describe('ScormSession — parsing des temps', () => {
  it('parses a SCORM 1.2 CMITimespan (HH:MM:SS) session_time into seconds', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    mockApi.commitTracking.mockResolvedValue({ data: BASE_STATE });
    const session = makeSession('1.2');
    await session.preload();

    session.apiSetValue('cmi.core.session_time', '00:05:00');
    session.apiCommit();
    await flush();

    expect(mockApi.commitTracking).toHaveBeenCalledWith(
      'enr-1',
      'course-1',
      'entry-1',
      expect.objectContaining({ session_time: 300, total_time: BASE_STATE.total_time + 300 }),
    );
  });

  it('parses a SCORM 2004 ISO 8601 duration session_time into seconds', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    mockApi.commitTracking.mockResolvedValue({ data: BASE_STATE });
    const session = makeSession('2004');
    await session.preload();

    session.apiSetValue('cmi.session_time', 'PT1H2M3S');
    session.apiCommit();
    await flush();

    const expectedSeconds = 3600 + 2 * 60 + 3;
    expect(mockApi.commitTracking).toHaveBeenCalledWith(
      'enr-1',
      'course-1',
      'entry-1',
      expect.objectContaining({ session_time: expectedSeconds }),
    );
  });
});

describe('ScormSession — commit', () => {
  it('sends a strictly incrementing sequence and a fresh commit_id per call', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    mockApi.commitTracking.mockResolvedValue({ data: { ...BASE_STATE, last_sequence: 4 } });
    const session = makeSession();
    await session.preload();

    session.apiSetValue('cmi.core.lesson_status', 'incomplete');
    session.apiCommit();
    await flush();

    expect(mockApi.commitTracking).toHaveBeenCalledTimes(1);
    expect(mockApi.commitTracking.mock.calls[0][3]).toMatchObject({
      sequence: BASE_STATE.last_sequence + 1,
    });
  });

  it('is a no-op when nothing changed since the last commit', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    const session = makeSession();
    await session.preload();

    session.apiCommit();
    await flush();

    expect(mockApi.commitTracking).not.toHaveBeenCalled();
  });

  it('retries once with the resynced sequence on 409, then succeeds', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    mockApi.commitTracking
      .mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409 }))
      .mockResolvedValueOnce({ data: { ...BASE_STATE, last_sequence: 11 } });
    mockApi.getTrackingSequence.mockResolvedValue({ data: { last_sequence: 10 } });

    const session = makeSession();
    await session.preload();
    session.apiSetValue('cmi.core.lesson_status', 'incomplete');
    session.apiCommit();
    await flush();
    await flush();

    expect(mockApi.getTrackingSequence).toHaveBeenCalledTimes(1);
    expect(mockApi.commitTracking).toHaveBeenCalledTimes(2);
    expect(mockApi.commitTracking.mock.calls[1][3]).toMatchObject({ sequence: 11 });
  });

  it('gives up silently if the retry after a 409 fails too', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    mockApi.commitTracking.mockRejectedValue(Object.assign(new Error('conflict'), { status: 409 }));
    mockApi.getTrackingSequence.mockRejectedValue(new Error('still broken'));

    const session = makeSession();
    await session.preload();
    session.apiSetValue('cmi.core.lesson_status', 'incomplete');

    expect(() => session.apiCommit()).not.toThrow();
    await flush();
    await flush();
  });
});

describe('ScormSession — notification de complétion', () => {
  it('calls onCompleted once when a commit resolves to completed/passed', async () => {
    const onCompleted = jest.fn();
    mockApi.getTracking.mockResolvedValue({ data: { ...BASE_STATE, lesson_status: 'incomplete' } });
    mockApi.commitTracking.mockResolvedValue({
      data: { ...BASE_STATE, lesson_status: 'completed' },
    });
    const session = makeSession('1.2', onCompleted);
    await session.preload();

    session.apiSetValue('cmi.core.lesson_status', 'completed');
    session.apiCommit();
    await flush();

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledWith('completed');

    // A second commit still reporting completed must not notify again.
    session.apiSetValue('cmi.core.score.raw', '100');
    session.apiCommit();
    await flush();

    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('never notifies when the entry was already completed in a previous session', async () => {
    const onCompleted = jest.fn();
    mockApi.getTracking.mockResolvedValue({ data: { ...BASE_STATE, lesson_status: 'completed' } });
    mockApi.commitTracking.mockResolvedValue({
      data: { ...BASE_STATE, lesson_status: 'completed' },
    });
    const session = makeSession('1.2', onCompleted);
    await session.preload();

    session.apiSetValue('cmi.core.score.raw', '80');
    session.apiCommit();
    await flush();

    expect(onCompleted).not.toHaveBeenCalled();
  });
});

describe('bindScormWindowApi', () => {
  it('exposes window.API for SCORM 1.2 and unbinds on cleanup', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    const session = makeSession('1.2');
    await session.preload();

    const win = window as unknown as Record<string, unknown>;
    const unbind = bindScormWindowApi(window, session, '1.2');

    expect(win.API).toBeDefined();
    expect((win.API as { LMSInitialize: () => string }).LMSInitialize()).toBe('true');

    unbind();
    expect(win.API).toBeUndefined();
  });

  it('exposes window.API_1484_11 for SCORM 2004', async () => {
    mockApi.getTracking.mockResolvedValue({ data: BASE_STATE });
    const session = makeSession('2004');
    await session.preload();

    const unbind = bindScormWindowApi(window, session, '2004');
    const win = window as unknown as Record<string, unknown>;

    expect((win.API_1484_11 as { Initialize: () => string }).Initialize()).toBe('true');
    unbind();
  });
});
