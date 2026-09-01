export interface StoreFormation {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryId: string;
  coverImage?: string;
  price: number;
  updatedAt: string;
  enrolledCompanies: number;
  moduleCount: number;
  evaluationCount: number;
}

export type StoreFormationLevel = 'Débutant' | 'Intermédiaire' | 'Avancé';

export interface StoreModuleStep {
  id: string;
  type: 'module';
  title: string;
  lessons: string[];
}

export interface StoreEvaluationStep {
  id: string;
  type: 'evaluation';
  title: string;
}

export type StoreProgramStep = StoreModuleStep | StoreEvaluationStep;

export interface StoreFormationDetails extends StoreFormation {
  shortDescription: string;
  fullDescription: string;
  level: StoreFormationLevel;
  duration: string;
  validity: string | null;
  language: string;
  certificate: boolean;
  learningObjectives: string[];
  programSteps: StoreProgramStep[];
  courseCount: number;
}

export const MOCK_STORE_CATEGORIES = [
  { id: 'cat-frontend', name: 'Développement Frontend' },
  { id: 'cat-backend', name: 'Développement Backend' },
  { id: 'cat-devops', name: 'DevOps & Infrastructure' },
  { id: 'cat-design', name: 'Design & UX' },
  { id: 'cat-data', name: 'Data & IA' },
  { id: 'cat-management', name: 'Management & Gestion de projet' },
];

export const MOCK_STORE_FORMATIONS: StoreFormation[] = [
  {
    id: 'sf-001',
    title: 'Introduction à React',
    author: 'Alice Martin',
    category: 'Développement Frontend',
    categoryId: 'cat-frontend',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop', // React code
    price: 0,
    updatedAt: '2026-06-15T10:00:00Z',
    enrolledCompanies: 12,
    moduleCount: 8,
    evaluationCount: 3,
  },
  {
    id: 'sf-002',
    title: 'TypeScript Avancé',
    author: 'Bob Dupont',
    category: 'Développement Frontend',
    categoryId: 'cat-frontend',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=640&h=360&fit=crop', // laptop coding
    price: 49,
    updatedAt: '2026-06-20T14:30:00Z',
    enrolledCompanies: 8,
    moduleCount: 12,
    evaluationCount: 5,
  },
  {
    id: 'sf-003',
    title: 'Node.js pour Débutants',
    author: 'Claire Bernard',
    category: 'Développement Backend',
    categoryId: 'cat-backend',
    coverImage:
      'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // node/server
    price: 39,
    updatedAt: '2026-05-28T09:00:00Z',
    enrolledCompanies: 5,
    moduleCount: 6,
    evaluationCount: 2,
  },
  {
    id: 'sf-004',
    title: 'Architecture Microservices',
    author: 'David Leroy',
    category: 'Développement Backend',
    categoryId: 'cat-backend',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop', // server racks
    price: 89,
    updatedAt: '2026-07-01T11:00:00Z',
    enrolledCompanies: 3,
    moduleCount: 15,
    evaluationCount: 7,
  },
  {
    id: 'sf-005',
    title: 'DevOps & CI/CD',
    author: 'Emma Petit',
    category: 'DevOps & Infrastructure',
    categoryId: 'cat-devops',
    coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=640&h=360&fit=crop', // CI/CD pipelines
    price: 0,
    updatedAt: '2026-06-10T16:00:00Z',
    enrolledCompanies: 20,
    moduleCount: 10,
    evaluationCount: 4,
  },
  {
    id: 'sf-006',
    title: 'Sécurité Web',
    author: 'François Simon',
    category: 'DevOps & Infrastructure',
    categoryId: 'cat-devops',
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=640&h=360&fit=crop', // cybersecurity
    price: 59,
    updatedAt: '2026-06-25T08:00:00Z',
    enrolledCompanies: 7,
    moduleCount: 9,
    evaluationCount: 3,
  },
  {
    id: 'sf-007',
    title: 'UI/UX Design Fondamentaux',
    author: 'Gabrielle Moreau',
    category: 'Design & UX',
    categoryId: 'cat-design',
    coverImage:
      'https://images.unsplash.com/photo-1646617747563-4f080bddf282?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // UX design
    price: 29,
    updatedAt: '2026-07-03T13:00:00Z',
    enrolledCompanies: 15,
    moduleCount: 7,
    evaluationCount: 2,
  },
  {
    id: 'sf-008',
    title: 'Machine Learning 101',
    author: 'Hugo Laurent',
    category: 'Data & IA',
    categoryId: 'cat-data',
    coverImage:
      'https://images.unsplash.com/photo-1495592822108-9e6261896da8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // AI/ML
    price: 99,
    updatedAt: '2026-06-18T10:30:00Z',
    enrolledCompanies: 4,
    moduleCount: 20,
    evaluationCount: 8,
  },
  {
    id: 'sf-009',
    title: 'Gestion de Projet Agile',
    author: 'Isabelle Roux',
    category: 'Management & Gestion de projet',
    categoryId: 'cat-management',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&h=360&fit=crop', // team meeting
    price: 0,
    updatedAt: '2026-05-30T12:00:00Z',
    enrolledCompanies: 18,
    moduleCount: 5,
    evaluationCount: 1,
  },
  {
    id: 'sf-010',
    title: 'Bases de Données SQL',
    author: 'Julien Blanc',
    category: 'Développement Backend',
    categoryId: 'cat-backend',
    coverImage:
      'https://images.unsplash.com/photo-1662027044921-6febc57a0c53?q=80&w=1162&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // database
    price: 45,
    updatedAt: '2026-06-05T15:00:00Z',
    enrolledCompanies: 9,
    moduleCount: 11,
    evaluationCount: 4,
  },
  {
    id: 'sf-011',
    title: 'GraphQL Moderne',
    author: 'Alice Martin',
    category: 'Développement Backend',
    categoryId: 'cat-backend',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop', // coding laptop
    price: 55,
    updatedAt: '2026-07-06T09:30:00Z',
    enrolledCompanies: 6,
    moduleCount: 8,
    evaluationCount: 3,
  },
  {
    id: 'sf-012',
    title: 'Accessibilité Web',
    author: 'Gabrielle Moreau',
    category: 'Design & UX',
    categoryId: 'cat-design',
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=640&h=360&fit=crop', // inclusive design
    price: 0,
    updatedAt: '2026-06-22T11:00:00Z',
    enrolledCompanies: 11,
    moduleCount: 6,
    evaluationCount: 2,
  },
];

function buildProgramSteps(formation: StoreFormation): StoreProgramStep[] {
  return [
    {
      id: `${formation.id}-step-1`,
      type: 'module',
      title: 'Les fondamentaux',
      lessons: ['Introduction', "Prise en main de l'environnement", 'Bonnes pratiques'],
    },
    {
      id: `${formation.id}-step-2`,
      type: 'evaluation',
      title: 'Validation des fondamentaux',
    },
    {
      id: `${formation.id}-step-3`,
      type: 'module',
      title: 'Mise en pratique',
      lessons: ['Cas concret 1', 'Cas concret 2', 'Atelier guidé'],
    },
    {
      id: `${formation.id}-step-4`,
      type: 'module',
      title: 'Approfondissement',
      lessons: ['Méthodes avancées', 'Optimisation', 'Industrialisation'],
    },
    {
      id: `${formation.id}-step-5`,
      type: 'evaluation',
      title: 'Évaluation finale',
    },
  ];
}

function countByType(programSteps: StoreProgramStep[], type: StoreProgramStep['type']) {
  return programSteps.filter((step) => step.type === type).length;
}

function countCourses(programSteps: StoreProgramStep[]) {
  return programSteps.reduce((sum, step) => {
    if (step.type !== 'module') {
      return sum;
    }
    return sum + step.lessons.length;
  }, 0);
}

function buildFormationDetails(formation: StoreFormation, index: number): StoreFormationDetails {
  const levels: StoreFormationLevel[] = ['Débutant', 'Intermédiaire', 'Avancé'];
  const programSteps = buildProgramSteps(formation);
  const moduleCount = countByType(programSteps, 'module');
  const evaluationCount = countByType(programSteps, 'evaluation');
  const courseCount = countCourses(programSteps);

  return {
    ...formation,
    moduleCount,
    evaluationCount,
    courseCount,
    shortDescription: `Maîtrisez ${formation.title} pour déployer des parcours de formation performants dans votre organisation.`,
    fullDescription:
      `Cette formation a été conçue pour des clients B2B souhaitant acquérir des licences et structurer la montée en compétences de leurs équipes. ` +
      `Vous visualisez ici l'architecture complète du parcours (modules et évaluations) sans accès au contenu pédagogique avant l'achat.`,
    level: levels[index % levels.length],
    duration: '3h 30min',
    validity: null,
    language: 'Français',
    certificate: true,
    learningObjectives: [
      'Comprendre la structure du parcours et ses étapes clés',
      'Identifier les compétences opérationnelles couvertes',
      'Évaluer la charge de travail et le niveau attendu',
      'Préparer le déploiement des licences pour vos apprenants',
    ],
    programSteps,
  };
}

export const MOCK_STORE_FORMATION_DETAILS: StoreFormationDetails[] = MOCK_STORE_FORMATIONS.map(
  (formation, index) => buildFormationDetails(formation, index),
);

export function getStoreFormationDetailsById(formationId: string) {
  return MOCK_STORE_FORMATION_DETAILS.find((formation) => formation.id === formationId);
}
