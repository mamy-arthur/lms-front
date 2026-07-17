import { Play, File, FileText, FileAudio, FileSpreadsheet, FilePlay } from 'lucide-react';
import type { ApiMedia } from '@/shared/api/media.api';
import { getMediaCategory, type MediaCategory } from './media-utils';

const iconMap: Record<
  Exclude<MediaCategory, 'image' | 'video'>,
  { Icon: React.ElementType; bg: string; fg: string }
> = {
  audio: { Icon: FileAudio, bg: 'bg-amber-100 dark:bg-amber-900/30', fg: 'text-amber-600 dark:text-amber-400' },
  pdf: { Icon: FileText, bg: 'bg-red-100 dark:bg-red-900/30', fg: 'text-red-600 dark:text-red-400' },
  document: { Icon: FileText, bg: 'bg-blue-100 dark:bg-blue-900/30', fg: 'text-blue-600 dark:text-blue-400' },
  spreadsheet: { Icon: FileSpreadsheet, bg: 'bg-green-100 dark:bg-green-900/30', fg: 'text-green-600 dark:text-green-400' },
  presentation: { Icon: FilePlay, bg: 'bg-orange-100 dark:bg-orange-900/30', fg: 'text-orange-600 dark:text-orange-400' },
  other: { Icon: File, bg: 'bg-muted', fg: 'text-muted-foreground' },
};

export function MediaThumbnail({ media }: { media: ApiMedia }) {
  const category = getMediaCategory(media.mime_type);

  if (category === 'image') {
    return (
      <img
        src={media.url}
        alt={media.original_name}
        className="h-10 w-10 rounded object-cover shrink-0 bg-muted"
      />
    );
  }

  if (category === 'video') {
    return (
      <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-slate-800 flex items-center justify-center">
        <video
          src={`${media.url}#t=0.1`}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          playsInline
          preload="metadata"
        />
        <Play className="relative z-10 h-4 w-4 fill-white text-white drop-shadow" />
      </div>
    );
  }

  const { Icon, bg, fg } = iconMap[category];

  return (
    <div className={`h-10 w-10 shrink-0 rounded flex items-center justify-center ${bg}`}>
      <Icon className={`h-5 w-5 ${fg}`} />
    </div>
  );
}
