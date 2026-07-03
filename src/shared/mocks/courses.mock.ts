export interface CourseCategory {
  id: string;
  name: string;
}

export interface MockCourse {
  id: string;
  fullName: string;
  categoryId: string;
}

export const MOCK_COURSE_CATEGORIES: CourseCategory[] = [
  { id: 'cat-frontend', name: 'Développement Frontend' },
  { id: 'cat-backend', name: 'Développement Backend' },
  { id: 'cat-devops', name: 'DevOps & Infrastructure' },
  { id: 'cat-design', name: 'Design & UX' },
  { id: 'cat-data', name: 'Data & IA' },
  { id: 'cat-management', name: 'Management & Gestion de projet' },
];

export const MOCK_COURSES: MockCourse[] = [
  { id: 'c-001', fullName: 'Introduction à React', categoryId: 'cat-frontend' },
  { id: 'c-002', fullName: 'TypeScript Avancé', categoryId: 'cat-frontend' },
  { id: 'c-003', fullName: 'Node.js pour Débutants', categoryId: 'cat-backend' },
  { id: 'c-004', fullName: 'Architecture Microservices', categoryId: 'cat-backend' },
  { id: 'c-005', fullName: 'DevOps & CI/CD', categoryId: 'cat-devops' },
  { id: 'c-006', fullName: 'Sécurité Web', categoryId: 'cat-devops' },
  { id: 'c-007', fullName: 'Bases de Données SQL', categoryId: 'cat-backend' },
  { id: 'c-008', fullName: 'UI/UX Design', categoryId: 'cat-design' },
  { id: 'c-009', fullName: 'Machine Learning 101', categoryId: 'cat-data' },
  { id: 'c-010', fullName: 'Gestion de Projet Agile', categoryId: 'cat-management' },
];
