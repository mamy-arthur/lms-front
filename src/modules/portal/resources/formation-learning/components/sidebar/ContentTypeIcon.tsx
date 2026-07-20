import {
  PlayCircle,
  FolderOpen,
  FileText,
  Paperclip,
  Globe,
  ScanLine,
  ClipboardList,
} from 'lucide-react';
import type { ContentType } from '../../lib/types';

export default function ContentTypeIcon({ type }: { type: ContentType }) {
  const icons: Record<ContentType, React.ElementType> = {
    page: FileText,
    file: Paperclip,
    folder: FolderOpen,
    scorm: ScanLine,
    survey: ClipboardList,
    url: Globe,
    'text-media': PlayCircle,
  };
  const Icon = icons[type] ?? FileText;
  return <Icon className="h-3 w-3 shrink-0 text-slate-400" />;
}
