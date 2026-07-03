import { MOCK_COURSES } from '@/shared/mocks/courses.mock';

export function getFormationName(formationId: string): string {
  const course = MOCK_COURSES.find((c) => c.id === formationId);
  return course?.fullName ?? formationId;
}
