'use client';

import { useCallback, useRef, useState } from 'react';
import type { Question } from '../types';
import type { MatchingAnswer, MultipleChoiceAnswer, TraineeAnswer } from '../types';
import { isQuestionAnswered } from '../utils/answer-completeness';

export function useQuizState(
  questions: Question[],
  options: {
    initialAnswers?: Record<string, TraineeAnswer>;
    onAnswerChange?: (id: string, answer: TraineeAnswer) => void;
    canEdit?: () => boolean;
  } = {},
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TraineeAnswer>>(
    options.initialAnswers ?? {},
  );
  const answersRef = useRef(answers);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState<Date>(() => new Date());
  const [completedAt, setCompletedAt] = useState<Date | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const answeredCount = questions.filter((question) =>
    isQuestionAnswered(question, answers[question.id]),
  ).length;

  const setAnswer = useCallback(
    (questionId: string, answer: TraineeAnswer) => {
      if (options.canEdit && !options.canEdit()) return;
      answersRef.current = { ...answersRef.current, [questionId]: answer };
      setAnswers(answersRef.current);
      // Never perform network side effects inside a React state updater: it may
      // be replayed by StrictMode / the compiler.
      options.onAnswerChange?.(questionId, answer);
    },
    [options.canEdit, options.onAnswerChange],
  );

  const toggleMultipleChoice = useCallback(
    (questionId: string, optionId: string) => {
      const current =
        (answersRef.current[questionId] as MultipleChoiceAnswer | undefined) ?? new Set<string>();
      const next = new Set(current);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      setAnswer(questionId, next);
    },
    [setAnswer],
  );

  const setMatchingPair = useCallback(
    (questionId: string, leftId: string, rightId: string) => {
      const current = (answersRef.current[questionId] as MatchingAnswer | undefined) ?? {};
      const next = { ...current };
      if (rightId === '') delete next[leftId];
      else next[leftId] = rightId;
      setAnswer(questionId, next);
    },
    [setAnswer],
  );

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
    answersRef.current = {};
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
