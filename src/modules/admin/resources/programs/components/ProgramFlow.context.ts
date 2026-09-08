import { createContext } from 'react';

export const FlowActionsContext = createContext<{
  onDeleteNode: (id: string) => void | Promise<void>;
  onConfigureEdge: (edgeId: string) => void;
  onEditNode: (id: string) => void;
  isLocked: boolean;
  lastNodeId: string | null;
  /** True when the deletable (last) node is the sole remaining module of a shop-visible LP. */
  warnShopRemovalOnDelete: boolean;
}>({
  onDeleteNode: () => {},
  onConfigureEdge: () => {},
  onEditNode: () => {},
  isLocked: false,
  lastNodeId: null,
  warnShopRemovalOnDelete: false,
});
