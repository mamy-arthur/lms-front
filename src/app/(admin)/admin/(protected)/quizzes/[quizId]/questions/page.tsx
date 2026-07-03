import { QuestionList } from '@/modules/admin/resources/questions';

export default async function AdminQuizQuestionsPage(props: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await props.params;
  return <QuestionList quizId={quizId} />;
}
