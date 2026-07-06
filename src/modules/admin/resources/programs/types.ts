import type { Edge, Node } from '@xyflow/react';
import type { StepNodeData, EdgeRuleData } from './components/ProgramFlow';
import type { ProgramFormValues } from './components/ProgramFormPanel';

export type StoredFlowData = {
  nodes: Node<StepNodeData, 'programStep'>[];
  edges: Edge<EdgeRuleData>[];
  nodeOrder: string[];
};

export type StoredProgram = {
  id: string;
  status: 'Publié' | 'Brouillon' | 'Archivé';
  formValues: ProgramFormValues;
  flow: StoredFlowData;
  createdAt: string;
  updatedAt: string;
};
