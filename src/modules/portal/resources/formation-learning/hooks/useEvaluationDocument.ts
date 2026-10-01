'use client';

import { useSyncExternalStore } from 'react';
import {
  evaluationDocument,
  subscribeEvaluationDocument,
} from '../lib/evaluation-document-session';

const serverSnapshot = () => null;

/** React observes the same identity boundary that synchronously stops drains. */
export function useEvaluationDocument() {
  return useSyncExternalStore(subscribeEvaluationDocument, evaluationDocument, serverSnapshot);
}