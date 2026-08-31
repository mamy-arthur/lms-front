import { createContext } from 'react';

export const FlowActionsContext = createContext<{
  onDeleteNode: (id: string) => void | Promise<void>;
  onConfigureEdge: (edgeId: string) => void;
  onEditNode: (id: string) => void;
  isLocked: boolean;
  lastNodeId: string | null;
}>({
  onDeleteNode: () => {},
  onConfigureEdge: () => {},
  onEditNode: () => {},
  isLocked: false,
  lastNodeId: null,
});
