import type { ComponentType } from 'react';
import { Award, BadgeCheck, BookOpen, ClipboardCheck, Mail } from 'lucide-react';
import type { StepType } from './ProgramFlow.types';

export type StepConfig = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  border: string;
  bg: string;
  iconColor: string;
  badgeClass: string;
  badgeLabel: string;
};

export const STEP_CONFIG: Record<StepType, StepConfig> = {
  email: {
    label: 'Email de démarrage',
    Icon: Mail,
    border: 'border-violet-300',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    badgeClass: 'border-violet-200 bg-violet-100 text-violet-700',
    badgeLabel: 'Email',
  },
  module: {
    label: 'Module',
    Icon: BookOpen,
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badgeClass: 'border-blue-200 bg-blue-100 text-blue-700',
    badgeLabel: 'Module',
  },
  'evaluation-intermediate': {
    label: 'Évaluation intermédiaire',
    Icon: ClipboardCheck,
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    badgeClass: 'border-orange-200 bg-orange-100 text-orange-700',
    badgeLabel: 'Intermédiaire',
  },
  'evaluation-final': {
    label: 'Évaluation finale',
    Icon: Award,
    border: 'border-red-300',
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    badgeClass: 'border-red-200 bg-red-100 text-red-700',
    badgeLabel: 'Finale',
  },
  attestation: {
    label: 'Attestation',
    Icon: BadgeCheck,
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    badgeClass: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    badgeLabel: 'Attestation',
  },
};
