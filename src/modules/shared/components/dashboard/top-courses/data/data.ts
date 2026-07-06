import { Course } from '../types';

export const topCourses: Course[] = [
  {
    id: '1',
    name: 'React Avancé',
    enrollments: 125,
    inProgress: 15,
    completed: 95,
    notStarted: 15,
  },
  {
    id: '2',
    name: 'Docker Fundamentals',
    enrollments: 98,
    inProgress: 20,
    completed: 67,
    notStarted: 11,
  },
  {
    id: '3',
    name: 'Kubernetes Basics',
    enrollments: 76,
    inProgress: 25,
    completed: 43,
    notStarted: 8,
  },
  {
    id: '4',
    name: 'TypeScript Mastery',
    enrollments: 52,
    inProgress: 2,
    completed: 50,
    notStarted: 0,
  },
  {
    id: '5',
    name: 'Next.js Expert',
    enrollments: 41,
    inProgress: 5,
    completed: 34,
    notStarted: 2,
  },
];
