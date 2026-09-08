import type { StepNode } from './ProgramFlow.types';

export const CANVAS_X = 300;
export const NODE_GAP = 150;

let _counter = 0;
export const genId = () => `step-${++_counter}`;

export const EMAIL_NODE_ID = 'email-start';

export const initialEmailNode: StepNode = {
  id: EMAIL_NODE_ID,
  type: 'programStep',
  position: { x: CANVAS_X, y: 0 },
  data: { stepType: 'email', label: "Choisir l'email de démarrage" },
};
