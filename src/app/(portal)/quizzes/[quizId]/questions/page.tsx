import { QuestionList } from "@/modules/portal/resources/questions";

export default async function PortalQuizQuestionsPage(props: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await props.params;
  return <QuestionList quizId={quizId} />;
}
