import type { TraineeFormation, LearningStats } from './types';

export const MOCK_FORMATIONS: TraineeFormation[] = [
  {
    id: '1',
    slug: 'developpement-flutter-avance',
    title: 'Développement Flutter Avancé',
    category: 'Mobile',
    coverImage:
      'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&auto=format&fit=crop&q=60',
    progress: 68,
    completedModules: 7,
    totalModules: 12,
    status: 'in_progress',
    lastActivity: "Aujourd'hui",
    currentLesson: "Gestion d'état avec Riverpod",
    progressDelta: 12,
  },
  {
    id: '2',
    slug: 'reactjs-maitrise',
    title: 'React.js Maîtrisé',
    category: 'Web',
    coverImage:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    progress: 35,
    completedModules: 4,
    totalModules: 10,
    status: 'in_progress',
    lastActivity: 'Hier',
    currentLesson: 'Hooks avancés',
  },
  {
    id: '3',
    slug: 'nodejs-express',
    title: 'Node.js & Express',
    category: 'Backend',
    coverImage:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
    progress: 100,
    completedModules: 8,
    totalModules: 8,
    status: 'completed',
    lastActivity: 'il y a 1 semaine',
    completedDate: '12 mai 2024',
    hasAttestation: true,
  },
  {
    id: '4',
    slug: 'docker-kubernetes',
    title: 'Docker & Kubernetes',
    category: 'DevOps',
    coverImage:
      'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60',
    progress: 20,
    completedModules: 2,
    totalModules: 9,
    status: 'in_progress',
    lastActivity: 'il y a 2 jours',
    currentLesson: 'Orchestration avec K8s',
  },
  {
    id: '5',
    slug: 'photographie-debutants',
    title: 'Photographie pour débutants',
    category: 'Art & Créativité',
    coverImage:
      'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=800&auto=format&fit=crop&q=60',
    progress: 65,
    completedModules: 7,
    totalModules: 12,
    status: 'in_progress',
    lastActivity: 'Hier',
  },
  {
    id: '6',
    slug: 'nutrition-alimentation-saine',
    title: 'Nutrition et alimentation saine',
    category: 'Santé & Bien-être',
    coverImage:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=60',
    progress: 40,
    completedModules: 4,
    totalModules: 10,
    status: 'in_progress',
    lastActivity: 'il y a 2 jours',
  },
  {
    id: '7',
    slug: 'gestion-financiere-personnelle',
    title: 'Gestion financière personnelle',
    category: 'Finance',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=60',
    progress: 100,
    completedModules: 8,
    totalModules: 8,
    status: 'completed',
    lastActivity: 'il y a 1 semaine',
    hasAttestation: true,
  },
  {
    id: '8',
    slug: 'voyage-decouverte-japon',
    title: 'Voyage et découverte du Japon',
    category: 'Voyage & Culture',
    coverImage:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=60',
    progress: 0,
    completedModules: 0,
    totalModules: 9,
    status: 'not_started',
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
