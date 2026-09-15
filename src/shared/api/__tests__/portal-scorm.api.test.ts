/** @jest-environment node */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPut: jest.fn(),
}));

import { apiGet, apiPut } from '@/shared/lib/apiClient';
import { portalScormApi } from '../portal-scorm.api';

const ENROLLMENT_ID = 'enrollment-1';
const COMPETENCY_ID = 'competency-1';
const COURSE_ID = 'course-1';
const ENTRY_ID = 'entry-1';
const BASE_URL = `enrollments/${ENROLLMENT_ID}/courses/${COURSE_ID}/entries/${ENTRY_ID}/scorm`;

describe('portalScormApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transmet competency_id aux lectures SCORM', async () => {
    await portalScormApi.launch(ENROLLMENT_ID, COMPETENCY_ID, COURSE_ID, ENTRY_ID);
    await portalScormApi.getTracking(ENROLLMENT_ID, COMPETENCY_ID, COURSE_ID, ENTRY_ID);
    await portalScormApi.getTrackingSequence(ENROLLMENT_ID, COMPETENCY_ID, COURSE_ID, ENTRY_ID);

    expect(apiGet).toHaveBeenNthCalledWith(1, `${BASE_URL}/launch`, {
      competency_id: COMPETENCY_ID,
    });
    expect(apiGet).toHaveBeenNthCalledWith(2, `${BASE_URL}/tracking`, {
      competency_id: COMPETENCY_ID,
    });
    expect(apiGet).toHaveBeenNthCalledWith(3, `${BASE_URL}/tracking/sequence`, {
      competency_id: COMPETENCY_ID,
    });
  });

  it('transmet competency_id dans le body du commit SCORM', async () => {
    await portalScormApi.commitTracking(ENROLLMENT_ID, COMPETENCY_ID, COURSE_ID, ENTRY_ID, {
      commit_id: 'commit-1',
      sequence: 1,
      lesson_status: 'incomplete',
    });

    expect(apiPut).toHaveBeenCalledWith(`${BASE_URL}/tracking`, {
      commit_id: 'commit-1',
      sequence: 1,
      lesson_status: 'incomplete',
      competency_id: COMPETENCY_ID,
    });
  });
});
