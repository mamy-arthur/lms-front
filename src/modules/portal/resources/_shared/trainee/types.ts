export type FormationStatus = 'in_progress' | 'completed' | 'not_started' | 'failed';

export interface TraineeFormation {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  coverImage: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  status: FormationStatus;
  enrolledAt: string;
  lastActivity: string;
  completedDate?: string;
  failureReason?: string | null;
  failedAt?: string;
  hasAttestation?: boolean;
  totalDurationMin: number;
  currentLesson?: string;
  progressDelta?: number;
}

export interface LearningStats {
  enrolledFormations: number;
  newEnrollments: number;
  completedFormations: number;
  certificatesEarned: number;
  hoursLearned: number;
  currentStreak: number;
}
