import type { CourseContent } from '../../lib/types';

export default function PageRenderer({ content }: { content: CourseContent }) {
  const body = content.data?.body as string | undefined;
  const language = content.data?.language as string | undefined;

  if (language && body) {
    return (
      <pre className="rounded-xl p-6 overflow-auto text-sm font-mono text-foreground border border-slate-700">
        <code>{body}</code>
      </pre>
    );
  }

  return (
    <div
      className="prose prose-invert max-w-none text-slate-200 leading-relaxed"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled mock
      dangerouslySetInnerHTML={{ __html: body ?? '<p>Contenu non disponible.</p>' }}
    />
  );
}
