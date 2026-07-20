import type { CourseContent } from '../../lib/types';

export default function TextMediaRenderer({ content }: { content: CourseContent }) {
  const mediaType = content.data?.mediaType as string | undefined;
  const url = content.data?.url as string | undefined;
  const body = content.data?.body as string | undefined;

  return (
    <div className="flex flex-col gap-6">
      {(mediaType === 'video' || mediaType === 'audio') && url && (
        <div className="rounded-xl overflow-hidden bg-black aspect-video">
          <video controls className="w-full h-full" src={url} />
        </div>
      )}
      {mediaType === 'image' && url && (
        <div className="rounded-xl overflow-hidden">
          <img src={url} alt={content.title} className="w-full object-cover max-h-96" />
        </div>
      )}
      {body && (
        <div
          className="prose prose-invert max-w-none text-slate-200 leading-relaxed"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled mock
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
      {!mediaType && !body && (
        <p className="text-slate-400 italic">Aucun contenu média disponible.</p>
      )}
    </div>
  );
}
