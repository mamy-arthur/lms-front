export type LessonType = 'video' | 'quiz' | 'exercise' | 'pdf' | 'text';
export type LessonStatus = 'completed' | 'in_progress' | 'available' | 'locked';

export interface Lesson {
  id: string;
  number: string;
  title: string;
  type: LessonType;
  durationMin: number;
  status: LessonStatus;
  questions?: number;
  score?: number;
}

export interface FormationModule {
  id: string;
  number: number;
  title: string;
  completedLessons: number;
  totalLessons: number;
  status: 'completed' | 'in_progress' | 'not_started';
  lessons: Lesson[];
}

export interface FormationResource {
  id: string;
  title: string;
  type: 'pdf' | 'zip' | 'link' | 'doc';
  size?: string;
}

export interface FormationDetailData {
  slug: string;
  title: string;
  status: 'in_progress' | 'completed' | 'not_started';
  category: string;
  level: string;
  description: string;
  coverImage: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  totalDurationMin: number;
  lastActivity: string;
  hasCertificate: boolean;
  modules: FormationModule[];
  resources: FormationResource[];
}
