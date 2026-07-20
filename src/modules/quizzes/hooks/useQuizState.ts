'use client';

import { useCallback, useState } from 'react';
import type { Question } from '../types';
import type { MatchingAnswer, MultipleChoiceAnswer, TraineeAnswer } from '../types';

export function useQuizState(questions: Question[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TraineeAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState<Date>(() => new Date());
  const [completedAt, setCompletedAt] = useState<Date | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const answeredCount = Object.keys(answers).filter((id) => {
    const a = answers[id];
    if (a === null || a === undefined) return false;
    if (a instanceof Set) return a.size > 0;
    if (typeof a === 'object') return Object.keys(a).length > 0;
    return true;
  }).length;

  const setAnswer = useCallback((questionId: string, answer: TraineeAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const toggleMultipleChoice = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as MultipleChoiceAnswer | undefined) ?? new Set<string>();
      const next = new Set(current);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return { ...prev, [questionId]: next };
    });
  }, []);

  const setMatchingPair = useCallback((questionId: string, leftId: string, rightId: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as MatchingAnswer | undefined) ?? {};
      return { ...prev, [questionId]: { ...current, [leftId]: rightId } };
    });
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) setCurrentIndex(index);
    },
    [totalQuestions],
  );

  const submit = useCallback(() => {
    setCompletedAt(new Date());
    setSubmitted(true);
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setCompletedAt(null);
  }, []);

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    isFirst,
    isLast,
    answeredCount,
    answers,
    submitted,
    startedAt,
    completedAt,
    setAnswer,
    toggleMultipleChoice,
    setMatchingPair,
    goNext,
    goPrev,
    goTo,
    submit,
    reset,
  };
}
