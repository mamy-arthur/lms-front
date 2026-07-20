import { Globe } from 'lucide-react';
import type { CourseContent } from '../../lib/types';

export default function UrlRenderer({ content }: { content: CourseContent }) {
  const url = content.data?.url as string | undefined;

  if (!url) {
    return <p className="text-(--color-primary) italic">URL non configurée.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 p-4 rounded-xl border">
        <Globe className="size-5 shrink-0" style={{ color: 'var(--color-primary)' }} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline break-all text-(--color-primary)"
        >
          {url}
        </a>
      </div>
      <iframe src={url} className="w-full h-[560px] rounded-xl border" title={content.title} />
    </div>
  );
}
