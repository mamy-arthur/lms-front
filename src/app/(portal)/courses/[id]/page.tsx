import { CourseContentPage } from "@/modules/portal/resources/courses";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  return <CourseContentPage key={id} />
}
