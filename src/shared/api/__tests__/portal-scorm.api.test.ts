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
const NODE_EXECUTION_ID = 'execution-1';
const BASE_URL = `enrollments/${ENROLLMENT_ID}/courses/${COURSE_ID}/entries/${ENTRY_ID}/scorm`;
const CONTEXT = {
  enrollmentId: ENROLLMENT_ID,
  competencyId: COMPETENCY_ID,
  courseId: COURSE_ID,
  entryId: ENTRY_ID,
  nodeExecutionId: NODE_EXECUTION_ID,
};

describe('portalScormApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('transmet le module et la visite en query sur les lectures SCORM', async () => {
    await portalScormApi.launch(CONTEXT);
    await portalScormApi.getTracking(CONTEXT);
    await portalScormApi.getTrackingSequence(CONTEXT);

    const expected = { competency_id: COMPETENCY_ID, node_execution_id: NODE_EXECUTION_ID };
    expect(apiGet).toHaveBeenNthCalledWith(1, `${BASE_URL}/launch`, expected);
    expect(apiGet).toHaveBeenNthCalledWith(2, `${BASE_URL}/tracking`, expected);
    expect(apiGet).toHaveBeenNthCalledWith(3, `${BASE_URL}/tracking/sequence`, expected);
  });

  it('transmet le contexte complet dans le body du commit SCORM', async () => {
    await portalScormApi.commitTracking(CONTEXT, {
      commit_id: 'commit-1',
      sequence: 1,
      lesson_status: 'incomplete',
      node_execution_id: NODE_EXECUTION_ID,
      expected_state_revision: 7,
    });

    expect(apiPut).toHaveBeenCalledWith(`${BASE_URL}/tracking`, {
      commit_id: 'commit-1',
      sequence: 1,
      lesson_status: 'incomplete',
      expected_state_revision: 7,
      competency_id: COMPETENCY_ID,
      node_execution_id: NODE_EXECUTION_ID,
    });
  });
});
