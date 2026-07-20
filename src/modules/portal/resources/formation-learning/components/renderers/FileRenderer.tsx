import { FileText, Folder, Download } from 'lucide-react';
import type { CourseContent } from '../../lib/types';

export default function FileRenderer({ content }: { content: CourseContent }) {
  const url = content.data?.url as string | undefined;
  const fileName = content.data?.fileName as string | undefined;
  const mimeType = content.data?.mimeType as string | undefined;
  const isPdf = mimeType === 'application/pdf';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 p-4 rounded-xl">
        <div
          className="flex size-12 items-center justify-center rounded-lg shrink-0"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          {isPdf ? (
            <FileText className="size-6" style={{ color: 'var(--color-primary)' }} />
          ) : (
            <Folder className="size-6" style={{ color: 'var(--color-primary)' }} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-(--color-primary)">{fileName ?? content.title}</p>
          {mimeType && <p className="text-xs text-slate-400">{mimeType}</p>}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-white text-sm rounded-lg transition-colors hover:opacity-85"
            style={{ background: 'var(--color-primary)' }}
          >
            <Download className="size-3.5" />
            Télécharger
          </a>
        )}
      </div>
      {isPdf && url && (
        <iframe src={url} className="w-full h-[600px] rounded-xl border" title={fileName} />
      )}
    </div>
  );
}
