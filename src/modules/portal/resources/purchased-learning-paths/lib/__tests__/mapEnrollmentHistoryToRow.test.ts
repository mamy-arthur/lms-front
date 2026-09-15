import type { ApiEnrollmentHistoryWithLearner } from '@/shared/types/enrollment.types';
import { mapEnrollmentHistoryToRow } from '../mappers';

const MOCK_ENROLLMENT_HISTORY: ApiEnrollmentHistoryWithLearner = {
  id: 'enr-002',
  learner_id: 'usr-002',
  status: 'completed',
  enrolled_at: '2026-06-01T00:00:00+00:00',
  started_at: '2026-06-05T00:00:00+00:00',
  completed_at: '2026-07-10T00:00:00+00:00',
  expires_at: '2026-09-01T08:00:00+00:00',
  learner: {
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'marie.martin@example.com',
    profile_photo: null,
  },
  failure_reason: null,
  failed_at: null,
};

describe('mapEnrollmentHistoryToRow', () => {
  it('mappe les champs learner, email, avatarUrl et les trois dates', () => {
    const result = mapEnrollmentHistoryToRow(MOCK_ENROLLMENT_HISTORY);

    expect(result).toEqual({
      id: 'enr-002',
      userId: 'usr-002',
      fullName: 'Marie Martin',
      email: 'marie.martin@example.com',
      avatarUrl: null,
      enrolledAt: '2026-06-01T00:00:00+00:00',
      startedAt: '2026-06-05T00:00:00+00:00',
      completedAt: '2026-07-10T00:00:00+00:00',
      failureReason: null,
      failedAt: null,
      expiresAt: '2026-09-01T08:00:00+00:00',
    });
  });

  it('utilise learner_id comme fullName si learner est null', () => {
    const result = mapEnrollmentHistoryToRow({ ...MOCK_ENROLLMENT_HISTORY, learner: null });

    expect(result.fullName).toBe('usr-002');
  });
});
