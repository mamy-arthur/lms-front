export type StudentStatus = 'active' | 'paused' | 'completed' | 'at_risk';

export type ModuleStatus = 'completed' | 'in_progress' | 'not_started';

export interface CourseModule {
  id: string;
  name: string;
  progress: number;
  status: ModuleStatus;
  duration?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'login' | 'module_completed' | 'quiz' | 'next_step';
  label: string;
  description: string;
  date: string;
}

export interface Student {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  course: string;
  progress: number;
  status: StudentStatus;
  lastActivity: string;
  startDate: string;
  elapsed: string;
  modules: CourseModule[];
  activity: ActivityEvent[];
}

export const STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Amélie Laurent',
    initials: 'AL',
    course: 'Full-Stack Web',
    progress: 78,
    status: 'active',
    lastActivity: 'il y a 2h',
    startDate: '12 sept. 2024',
    elapsed: '3 mois',
    modules: [
      {
        id: 'm1',
        name: 'Introduction',
        progress: 100,
        status: 'completed',
        duration: '2h',
      },
      {
        id: 'm2',
        name: 'React',
        progress: 60,
        status: 'in_progress',
        duration: '12h',
      },
      {
        id: 'm3',
        name: 'Node.js',
        progress: 40,
        status: 'in_progress',
        duration: '10h',
      },
      {
        id: 'm4',
        name: 'Docker',
        progress: 0,
        status: 'not_started',
        duration: '6h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 1h25',
        date: "Aujourd'hui, 14:30",
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Module terminé',
        description: 'Introduction à React',
        date: 'Hier, 18:12',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Quiz réussi',
        description: 'JSX & Composants — 92%',
        date: 'Hier, 17:40',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Hooks avancés',
        date: 'À venir',
      },
    ],
  },
  {
    id: '2',
    name: 'Marc Dubois',
    initials: 'MD',
    course: 'Data Science',
    progress: 42,
    status: 'active',
    lastActivity: 'il y a 1j',
    startDate: '3 oct. 2024',
    elapsed: '2 mois',
    modules: [
      {
        id: 'm1',
        name: 'Python',
        progress: 100,
        status: 'completed',
        duration: '8h',
      },
      {
        id: 'm2',
        name: 'Pandas',
        progress: 70,
        status: 'in_progress',
        duration: '6h',
      },
      {
        id: 'm3',
        name: 'Machine Learning',
        progress: 0,
        status: 'not_started',
        duration: '20h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 45min',
        date: 'Hier, 09:10',
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Module terminé',
        description: 'Python — Bases',
        date: 'Il y a 3j',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Quiz réussi',
        description: 'Structures de données — 88%',
        date: 'Il y a 4j',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Visualisation Matplotlib',
        date: 'À venir',
      },
    ],
  },
  {
    id: '3',
    name: 'Sofia Müller',
    initials: 'SM',
    course: 'UX Design',
    progress: 95,
    status: 'active',
    lastActivity: 'il y a 30min',
    startDate: '1 août 2024',
    elapsed: '5 mois',
    modules: [
      {
        id: 'm1',
        name: 'Recherche utilisateur',
        progress: 100,
        status: 'completed',
        duration: '5h',
      },
      {
        id: 'm2',
        name: 'Wireframing',
        progress: 100,
        status: 'completed',
        duration: '4h',
      },
      {
        id: 'm3',
        name: 'Prototypage Figma',
        progress: 80,
        status: 'in_progress',
        duration: '8h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 2h',
        date: "Aujourd'hui, 15:55",
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Module terminé',
        description: 'Wireframing',
        date: 'Avant-hier',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Quiz réussi',
        description: 'Heuristiques de Nielsen — 100%',
        date: 'Avant-hier',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Tests utilisateurs',
        date: 'À venir',
      },
    ],
  },
  {
    id: '4',
    name: 'Hugo Bernard',
    initials: 'HB',
    course: 'DevOps',
    progress: 15,
    status: 'at_risk',
    lastActivity: 'il y a 12j',
    startDate: '20 oct. 2024',
    elapsed: '2 mois',
    modules: [
      {
        id: 'm1',
        name: 'Linux Basics',
        progress: 60,
        status: 'in_progress',
        duration: '6h',
      },
      {
        id: 'm2',
        name: 'CI/CD',
        progress: 0,
        status: 'not_started',
        duration: '10h',
      },
      {
        id: 'm3',
        name: 'Kubernetes',
        progress: 0,
        status: 'not_started',
        duration: '12h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 20min',
        date: 'Il y a 12j',
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Aucun module terminé',
        description: '—',
        date: '—',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Dernier quiz',
        description: 'Linux — 58%',
        date: 'Il y a 14j',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Reprendre Linux Basics',
        date: 'À planifier',
      },
    ],
  },
  {
    id: '5',
    name: 'Clara Rossi',
    initials: 'CR',
    course: 'Full-Stack Web',
    progress: 100,
    status: 'completed',
    lastActivity: 'il y a 3j',
    startDate: '10 mai 2024',
    elapsed: '7 mois',
    modules: [
      {
        id: 'm1',
        name: 'Introduction',
        progress: 100,
        status: 'completed',
        duration: '2h',
      },
      {
        id: 'm2',
        name: 'React',
        progress: 100,
        status: 'completed',
        duration: '12h',
      },
      {
        id: 'm3',
        name: 'Node.js',
        progress: 100,
        status: 'completed',
        duration: '10h',
      },
      {
        id: 'm4',
        name: 'Docker',
        progress: 100,
        status: 'completed',
        duration: '6h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 30min',
        date: 'Il y a 3j',
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Cursus terminé',
        description: 'Full-Stack Web',
        date: 'Il y a 3j',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Examen final',
        description: 'Score 96%',
        date: 'Il y a 4j',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Certification délivrée',
        date: 'Terminé',
      },
    ],
  },
  {
    id: '6',
    name: 'Yanis Cohen',
    initials: 'YC',
    course: 'Data Science',
    progress: 30,
    status: 'paused',
    lastActivity: 'il y a 5j',
    startDate: '15 sept. 2024',
    elapsed: '3 mois',
    modules: [
      {
        id: 'm1',
        name: 'Python',
        progress: 100,
        status: 'completed',
        duration: '8h',
      },
      {
        id: 'm2',
        name: 'SQL',
        progress: 50,
        status: 'in_progress',
        duration: '6h',
      },
      {
        id: 'm3',
        name: 'Machine Learning',
        progress: 0,
        status: 'not_started',
        duration: '20h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 15min',
        date: 'Il y a 5j',
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Module terminé',
        description: 'Python — Bases',
        date: 'Il y a 10j',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Quiz réussi',
        description: 'SQL Joins — 75%',
        date: 'Il y a 6j',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Reprendre SQL',
        date: 'À venir',
      },
    ],
  },
  {
    id: '7',
    name: 'Léa Moreau',
    initials: 'LM',
    course: 'UX Design',
    progress: 64,
    status: 'active',
    lastActivity: 'il y a 4h',
    startDate: '5 sept. 2024',
    elapsed: '4 mois',
    modules: [
      {
        id: 'm1',
        name: 'Recherche utilisateur',
        progress: 100,
        status: 'completed',
        duration: '5h',
      },
      {
        id: 'm2',
        name: 'Wireframing',
        progress: 80,
        status: 'in_progress',
        duration: '4h',
      },
      {
        id: 'm3',
        name: 'Prototypage Figma',
        progress: 20,
        status: 'in_progress',
        duration: '8h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 1h10',
        date: "Aujourd'hui, 12:00",
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Module terminé',
        description: 'Recherche utilisateur',
        date: 'Il y a 8j',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Quiz réussi',
        description: 'Personas — 85%',
        date: 'Il y a 7j',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Finaliser wireframes',
        date: 'À venir',
      },
    ],
  },
  {
    id: '8',
    name: 'Tom Lefèvre',
    initials: 'TL',
    course: 'DevOps',
    progress: 50,
    status: 'active',
    lastActivity: 'il y a 1j',
    startDate: '1 sept. 2024',
    elapsed: '4 mois',
    modules: [
      {
        id: 'm1',
        name: 'Linux Basics',
        progress: 100,
        status: 'completed',
        duration: '6h',
      },
      {
        id: 'm2',
        name: 'CI/CD',
        progress: 60,
        status: 'in_progress',
        duration: '10h',
      },
      {
        id: 'm3',
        name: 'Kubernetes',
        progress: 0,
        status: 'not_started',
        duration: '12h',
      },
    ],
    activity: [
      {
        id: 'a1',
        type: 'login',
        label: 'Dernière connexion',
        description: 'Session de 50min',
        date: 'Hier, 19:20',
      },
      {
        id: 'a2',
        type: 'module_completed',
        label: 'Module terminé',
        description: 'Linux Basics',
        date: 'Il y a 12j',
      },
      {
        id: 'a3',
        type: 'quiz',
        label: 'Quiz réussi',
        description: 'GitHub Actions — 80%',
        date: 'Il y a 5j',
      },
      {
        id: 'a4',
        type: 'next_step',
        label: 'Prochaine étape',
        description: 'Pipelines avancés',
        date: 'À venir',
      },
    ],
  },
];

export const STATUS_LABEL: Record<StudentStatus, string> = {
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  at_risk: 'À risque',
};
