import type { TraineeFormation, LearningStats } from './types';

export const MOCK_FORMATIONS: TraineeFormation[] = [
  {
    id: '1',
    slug: 'developpement-flutter-avance',
    title: 'Développement Flutter Avancé',
    description:
      'Au cours de cette formation, vous découvrirez les bonnes pratiques du développement Flutter, l’architecture d’applications complexes, la gestion avancée de l’état, l’intégration avec des API et des services externes, ainsi que les techniques permettant d’améliorer les performances et la qualité de vos applications. Au cours de cette formation, vous découvrirez les bonnes pratiques du développement Flutter, l’architecture d’applications complexes, la gestion avancée de l’état, l’intégration avec des API et des services externes, ainsi que les techniques permettant d’améliorer les performances et la qualité de vos applications.',
    category: 'Mobile',
    coverImage:
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    progress: 68,
    completedModules: 7,
    totalModules: 12,
    totalDurationMin: 720,
    status: 'in_progress',
    enrolledAt: '2024-03-01T00:00:00Z',
    lastActivity: "Aujourd'hui",
    currentLesson: "Gestion d'état avec Riverpod",
    progressDelta: 12,
  },
  {
    id: '2',
    slug: 'reactjs-maitrise',
    title: 'React.js Maîtrisé',
    description:
      'Approfondissez React avec les hooks avancés, le context API et les patterns de performance.',
    category: 'Web',
    coverImage:
      'https://images.unsplash.com/photo-1448932223592-d1fc686e76ea?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    progress: 35,
    completedModules: 4,
    totalModules: 10,
    totalDurationMin: 600,
    status: 'in_progress',
    enrolledAt: '2024-04-15T00:00:00Z',
    lastActivity: 'Hier',
    currentLesson: 'Hooks avancés',
  },
  {
    id: '3',
    slug: 'nodejs-express',
    title: 'Node.js & Express',
    description:
      'Créez des APIs REST robustes et des applications serveur évolutives avec Node.js et Express.',
    category: 'Backend',
    coverImage:
      'https://images.unsplash.com/photo-1758874573111-76d77f6ec690?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    progress: 100,
    completedModules: 8,
    totalModules: 8,
    totalDurationMin: 480,
    status: 'completed',
    enrolledAt: '2024-02-10T00:00:00Z',
    lastActivity: 'il y a 1 semaine',
    completedDate: '12 mai 2024',
    hasAttestation: true,
  },
  {
    id: '4',
    slug: 'docker-kubernetes',
    title: 'Docker & Kubernetes',
    description:
      'Conteneurisez vos applications et orchestrez-les en production avec Docker et Kubernetes.',
    category: 'DevOps',
    coverImage:
      'https://images.unsplash.com/photo-1646627927863-19874c27316b?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    progress: 20,
    completedModules: 2,
    totalModules: 9,
    totalDurationMin: 540,
    status: 'in_progress',
    enrolledAt: '2024-05-20T00:00:00Z',
    lastActivity: 'il y a 2 jours',
    currentLesson: 'Orchestration avec K8s',
  },
  {
    id: '5',
    slug: 'photographie-debutants',
    title: 'Photographie pour débutants',
    description:
      'Découvrez les bases de la photo : composition, lumière et réglages manuels de votre appareil.',
    category: 'Art & Créativité',
    coverImage:
      'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=800&auto=format&fit=crop&q=60',
    progress: 65,
    completedModules: 7,
    totalModules: 12,
    totalDurationMin: 360,
    status: 'in_progress',
    enrolledAt: '2024-06-01T00:00:00Z',
    lastActivity: 'Hier',
  },
  {
    id: '6',
    slug: 'nutrition-alimentation-saine',
    title: 'Nutrition et alimentation saine',
    description:
      'Adoptez de meilleures habitudes alimentaires grâce aux principes de la nutrition moderne.',
    category: 'Santé & Bien-être',
    coverImage:
      'https://images.unsplash.com/photo-1673515335564-fbe94030e4b7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    progress: 40,
    completedModules: 4,
    totalModules: 10,
    totalDurationMin: 300,
    status: 'in_progress',
    enrolledAt: '2024-06-10T00:00:00Z',
    lastActivity: 'il y a 2 jours',
  },
  {
    id: '7',
    slug: 'gestion-financiere-personnelle',
    title: 'Gestion financière personnelle',
    description:
      'Apprenez à budgétiser, épargner et investir intelligemment pour atteindre vos objectifs financiers.',
    category: 'Finance',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=60',
    progress: 100,
    completedModules: 8,
    totalModules: 8,
    totalDurationMin: 480,
    status: 'completed',
    enrolledAt: '2024-01-15T00:00:00Z',
    lastActivity: 'il y a 1 semaine',
    hasAttestation: true,
  },
  {
    id: '8',
    slug: 'voyage-decouverte-japon',
    title: 'Voyage et découverte du Japon',
    description:
      'Explorez la culture, les traditions et les incontournables du Japon pour préparer votre voyage.',
    category: 'Voyage & Culture',
    coverImage:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=60',
    progress: 0,
    completedModules: 0,
    totalModules: 9,
    totalDurationMin: 270,
    status: 'not_started',
    enrolledAt: '2024-07-01T00:00:00Z',
    lastActivity: 'Jamais commencé',
  },
];

export const FEATURED_FORMATION: TraineeFormation =
  MOCK_FORMATIONS.find((c) => c.status === 'in_progress') ?? MOCK_FORMATIONS[0];

export const LEARNING_STATS: LearningStats = {
  enrolledFormations: MOCK_FORMATIONS.length,
  newEnrollments: 2,
  completedFormations: MOCK_FORMATIONS.filter((c) => c.status === 'completed').length,
  certificatesEarned: MOCK_FORMATIONS.filter((c) => c.hasAttestation).length,
  hoursLearned: 47,
  currentStreak: 5,
};
