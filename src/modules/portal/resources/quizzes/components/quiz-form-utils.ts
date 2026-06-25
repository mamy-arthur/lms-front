export { extractApiError } from "@/shared/utils/api-error";

export function genQuizId(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 20);
  const rand = Math.floor(100 + Math.random() * 900);
  return slug ? `${slug}-${rand}` : `QUIZ-${rand}`;
}
