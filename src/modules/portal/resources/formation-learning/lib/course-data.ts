import type { Formation, FormationModule, FormationEvaluation } from './types';

const module1: FormationModule = {
  id: 'm1',
  formationId: 'f1',
  type: 'module',
  title: 'Fondamentaux TypeScript',
  status: 'completed',
  progress: 100,
  order: 1,
  courses: [
    {
      id: 'course1',
      title: 'Introduction à TypeScript',
      sections: [
        {
          id: 'sec1',
          moduleId: 'm1',
          title: 'Présentation',
          contents: [
            {
              id: 'c1',
              sectionId: 'sec1',
              type: 'text-media',
              title: 'TypeScript en 100 secondes',
              status: 'completed',
              durationMin: 2,
              data: { mediaType: 'video', url: 'https://www.youtube.com/embed/zQnBQ4tB3ZA' },
            },
            {
              id: 'c2',
              sectionId: 'sec1',
              type: 'url',
              title: 'Documentation officielle TypeScript',
              status: 'completed',
              durationMin: 1,
              data: {
                url: 'https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'course2',
      title: "Configuration de l'environnement",
      sections: [
        {
          id: 'sec2',
          moduleId: 'm1',
          title: 'Installation & Configuration',
          contents: [
            {
              id: 'c3',
              sectionId: 'sec2',
              type: 'text-media',
              title: 'Node.js & TypeScript – Setup complet',
              status: 'completed',
              durationMin: 14,
              data: { mediaType: 'video', url: 'https://www.youtube.com/embed/ENrzD9HAZK4' },
            },
            {
              id: 'c4',
              sectionId: 'sec2',
              type: 'page',
              title: 'Configuration tsconfig.json',
              status: 'completed',
              durationMin: 8,
              data: {
                language: 'json',
                body: '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "strict": true\n  }\n}',
              },
            },
            {
              id: 'c5',
              sectionId: 'sec2',
              type: 'file',
              title: 'TypeScript Handbook (PDF)',
              status: 'completed',
              durationMin: 4,
              data: {
                mimeType: 'application/pdf',
                url: 'https://www.typescriptlang.org/assets/typescript-handbook.pdf',
                fileName: 'typescript-handbook.pdf',
              },
            },
            {
              id: 'c5b',
              sectionId: 'sec2',
              type: 'page',
              title: 'Pourquoi TypeScript ?',
              status: 'completed',
              durationMin: 4,
              data: {
                body: 'TypeScript est un sur-ensemble typé de JavaScript.\n\nIl compile vers JavaScript standard.',
              },
            },
          ],
        },
      ],
    },
  ],
};

const eval1: FormationEvaluation = {
  id: 'ev1',
  formationId: 'f1',
  type: 'evaluation',
  evaluationType: 'intermediate',
  title: 'Évaluation – Fondamentaux TypeScript',
  status: 'completed',
  order: 2,
  passingScore: 70,
  maxAttempts: 3,
  durationMin: 15,
  questions: [
    {
      id: 'q1',
      quizId: 'ev1',
      text: 'Que signifie `readonly` en TypeScript ?',
      type: 'single_choice',
      generalFeedback: '`readonly` empêche la réassignation après initialisation.',
      options: [
        { id: 'q1a', label: 'La propriété est privée', isCorrect: false },
        { id: 'q1b', label: 'La propriété ne peut pas être réassignée', isCorrect: true },
        { id: 'q1c', label: 'La propriété est optionnelle', isCorrect: false },
        { id: 'q1d', label: 'La propriété est statique', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      quizId: 'ev1',
      text: 'Lesquels sont des types primitifs TypeScript ?',
      type: 'multiple_choice',
      options: [
        { id: 'q2a', label: 'string', isCorrect: true },
        { id: 'q2b', label: 'number', isCorrect: true },
        { id: 'q2c', label: 'object', isCorrect: false },
        { id: 'q2d', label: 'boolean', isCorrect: true },
      ],
    },
    {
      id: 'q3',
      quizId: 'ev1',
      text: 'TypeScript est un sur-ensemble de JavaScript.',
      type: 'true_false',
      correctAnswer: true,
      feedbackTrue: 'Correct !',
      feedbackFalse: 'TypeScript est un sur-ensemble de JavaScript.',
    },
  ],
  attempt: {
    id: 'att1',
    startedAt: '2025-07-10T09:00:00Z',
    completedAt: '2025-07-10T09:12:00Z',
    score: 85,
    passed: true,
    answers: { q1: ['q1b'], q2: ['q2a', 'q2b', 'q2d'], q3: ['q3a'] },
  },
};

const module2: FormationModule = {
  id: 'm2',
  formationId: 'f1',
  type: 'module',
  title: 'React avec TypeScript',
  status: 'in_progress',
  progress: 40,
  order: 3,
  courses: [
    {
      id: 'course3',
      title: 'Composants React',
      sections: [
        {
          id: 'sec3',
          moduleId: 'm2',
          title: 'Composants typés',
          contents: [
            {
              id: 'c6',
              sectionId: 'sec3',
              type: 'text-media',
              title: 'React & TypeScript – crash course',
              status: 'completed',
              durationMin: 22,
              data: { mediaType: 'video', url: 'https://www.youtube.com/embed/TPACABQTHvM' },
            },
            {
              id: 'c7',
              sectionId: 'sec3',
              type: 'page',
              title: 'Les bases des props typées',
              status: 'in_progress',
              durationMin: 8,
              data: {
                body: "<p class='text-muted-foreground'>Les props typées permettent de définir précisément la forme des données qu'un composant React accepte.</p>",
              },
            },
            {
              id: 'c8',
              sectionId: 'sec3',
              type: 'text-media',
              title: 'Diagramme – flux de données React',
              status: 'available',
              durationMin: 2,
              data: {
                mediaType: 'image',
                url: 'https://picsum.photos/seed/react-data-flow/1200/600',
              },
            },
          ],
        },
        {
          id: 'sec4',
          moduleId: 'm2',
          title: 'Hooks avancés',
          contents: [
            {
              id: 'c9',
              sectionId: 'sec4',
              type: 'scorm',
              title: 'React Query Fundamentals – Module SCORM',
              status: 'available',
              durationMin: 15,
              data: {},
            },
            {
              id: 'c10',
              sectionId: 'sec4',
              type: 'survey',
              title: 'Sondage – Votre expérience avec les Hooks',
              status: 'available',
              durationMin: 3,
              data: {
                questions: [
                  {
                    id: 'sq1',
                    text: 'Utilisez-vous useCallback ?',
                    type: 'single',
                    choices: ['Jamais', 'Parfois', 'Souvent', 'Toujours'],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

const eval2: FormationEvaluation = {
  id: 'ev2',
  formationId: 'f1',
  type: 'evaluation',
  evaluationType: 'final',
  title: 'Évaluation finale – React & TypeScript',
  status: 'locked',
  order: 4,
  passingScore: 75,
  maxAttempts: 2,
  durationMin: 30,
  questions: [
    {
      id: 'q4',
      quizId: 'ev2',
      text: 'Quel hook mémorise une valeur calculée ?',
      type: 'single_choice',
      options: [
        { id: 'q4a', label: 'useCallback', isCorrect: false },
        { id: 'q4b', label: 'useMemo', isCorrect: true },
        { id: 'q4c', label: 'useRef', isCorrect: false },
        { id: 'q4d', label: 'useEffect', isCorrect: false },
      ],
    },
    {
      id: 'q5',
      quizId: 'ev2',
      text: 'Lesquels sont des hooks React natifs ?',
      type: 'multiple_choice',
      options: [
        { id: 'q5a', label: 'useState', isCorrect: true },
        { id: 'q5b', label: 'useQuery', isCorrect: false },
        { id: 'q5c', label: 'useReducer', isCorrect: true },
        { id: 'q5d', label: 'useContext', isCorrect: true },
      ],
    },
    {
      id: 'q6',
      quizId: 'ev2',
      text: 'useEffect est exécuté avant le rendu.',
      type: 'true_false',
      correctAnswer: false,
      feedbackTrue: 'Non, useEffect est exécuté après le rendu.',
      feedbackFalse: 'Correct ! useEffect est exécuté après le rendu (post-render).',
    },
  ],
  attempt: null,
};

export const MOCK_FORMATION: Formation = {
  id: 'f1',
  slug: 'react-typescript-entreprise',
  title: 'Maîtriser React & TypeScript en entreprise',
  description: 'Apprenez à construire des applications React modernes avec TypeScript.',
  instructor: 'Marie Dupont',
  progress: 52,
  totalDurationMin: 870,
  nodes: [module1, eval1, module2, eval2],
  attestation: null,
};

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
