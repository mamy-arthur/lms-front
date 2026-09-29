import {
  clearVideoDraft,
  readVideoDraft,
  writeVideoDraft,
  type VideoDraft,
} from '../videoProgressStorage';

const storageKey = 'learneo:video-progress:v1';
const draft = (overrides: Partial<VideoDraft> = {}): VideoDraft => ({
  position: 20,
  duration: 600,
  ranges: [[0, 20]],
  version: 1,
  pendingCommitId: 'commit',
  updatedAt: Date.now(),
  ...overrides,
});

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

it('stores separate drafts and only clears the acknowledged commit', () => {
  writeVideoDraft('learner-1/video-1', draft());
  writeVideoDraft('learner-2/video-1', draft({ position: 40, pendingCommitId: 'newer' }));
  clearVideoDraft('learner-1/video-1', 'old');
  expect(readVideoDraft('learner-1/video-1')?.position).toBe(20);
  clearVideoDraft('learner-1/video-1', 'commit');
  expect(readVideoDraft('learner-1/video-1')).toBeUndefined();
  expect(readVideoDraft('learner-2/video-1')?.position).toBe(40);
});

it.each([
  { position: -1 },
  { position: 601 },
  { duration: 604801 },
  { version: -1 },
  { ranges: [[0, 601]] },
  { ranges: [[20, 10]] },
  { updatedAt: Date.now() - 24 * 60 * 60 * 1000 },
])('ignores invalid or expired drafts: %j', (invalid) => {
  localStorage.setItem(storageKey, JSON.stringify({ video: { ...draft(), ...invalid } }));
  expect(readVideoDraft('video')).toBeUndefined();
});

it('bounds storage to the twenty most recent drafts', () => {
  for (let i = 0; i < 22; i++)
    writeVideoDraft(`video-${i}`, draft({ updatedAt: Date.now() - 100 + i }));
  expect(readVideoDraft('video-0')).toBeUndefined();
  expect(readVideoDraft('video-1')).toBeUndefined();
  expect(readVideoDraft('video-21')).toBeDefined();
  expect(Object.keys(JSON.parse(localStorage.getItem(storageKey)!))).toHaveLength(20);
});

it('keeps playback safe when storage is corrupt or unavailable', () => {
  localStorage.setItem(storageKey, '{invalid');
  expect(readVideoDraft('video')).toBeUndefined();
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => writeVideoDraft('video', draft())).not.toThrow();
  expect(() => clearVideoDraft('video', 'commit')).not.toThrow();
});
