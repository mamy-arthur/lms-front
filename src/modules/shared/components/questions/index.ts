export const QUESTION_TYPE_LABELS: Record<string, string> = {
  true_false: 'Vrai/Faux',
  single_choice: 'Choix unique',
  multiple_choice: 'Choix multiple',
  matching: 'Appariement',
};

export const QUESTION_TYPE_OPTIONS = [
  { value: 'true_false', label: 'Vrai/Faux' },
  { value: 'single_choice', label: 'Choix unique' },
  { value: 'multiple_choice', label: 'Choix multiple' },
  { value: 'matching', label: 'Appariement' },
];

export const DURATION_UNIT_LABELS: Record<string, string> = {
  second: 'Seconde(s)',
  minute: 'Minute(s)',
  hour: 'Heure(s)',
  day: 'Jour(s)',
  week: 'Semaine(s)',
};

export const DURATION_UNIT_OPTIONS = [
  { value: 'second', label: 'Seconde(s)' },
  { value: 'minute', label: 'Minute(s)' },
  { value: 'hour', label: 'Heure(s)' },
  { value: 'day', label: 'Jour(s)' },
  { value: 'week', label: 'Semaine(s)' },
];
