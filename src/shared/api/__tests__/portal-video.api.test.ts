import { httpClient } from '@/shared/lib/apiClient';
import {
  portalVideoApi,
  type VideoProgressContext,
  type VideoProgressPayload,
} from '../portal-video.api';

jest.mock('@/shared/lib/apiClient', () => ({ httpClient: jest.fn() }));
const context: VideoProgressContext = {
  enrollmentId: 'enrollment',
  competencyId: 'module',
  courseId: 'course',
  entryId: 'entry',
  mediaId: 'video',
  nodeExecutionId: 'visit',
};
const path = 'enrollments/enrollment/courses/course/entries/entry/videos/video/progress';
const progress = {
  node_id: 'module',
  node_execution_id: 'visit',
  position: 20,
  duration: 600,
  watched_ranges: [[0, 20]],
  watched_seconds: 20,
  version: 1,
  last_commit_id: 'commit',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(httpClient).mockResolvedValue({
    status: 200,
    headers: new Headers(),
    body: '',
    json: { data: progress },
  });
});

it('loads the video bookmark through the authenticated tenant transport', async () => {
  const { signal } = new AbortController();
  await expect(portalVideoApi.get(context, signal)).resolves.toEqual(progress);
  expect(httpClient).toHaveBeenCalledWith(`${path}?competency_id=module&node_execution_id=visit`, {
    signal,
  });
});

it('sends execution, version and commit identity with keepalive on exit', async () => {
  const { signal } = new AbortController();
  const payload: VideoProgressPayload = {
    competency_id: 'module',
    node_execution_id: 'visit',
    expected_state_revision: 7,
    position: 20,
    duration: 600,
    watched_ranges: [[0, 20]],
    version: 0,
    commit_id: 'commit',
  };
  await expect(portalVideoApi.save(context, payload, signal, true)).resolves.toEqual(progress);
  expect(httpClient).toHaveBeenCalledWith(path, {
    method: 'PUT',
    body: JSON.stringify(payload),
    signal,
    keepalive: true,
  });
});

it('propagates conflicts so the session stops stale writes', async () => {
  const error = Object.assign(new Error('Conflict'), { status: 409 });
  jest.mocked(httpClient).mockRejectedValueOnce(error);
  await expect(portalVideoApi.get(context, new AbortController().signal)).rejects.toBe(error);
});
