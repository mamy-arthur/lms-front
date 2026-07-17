import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ApiMedia } from '@/shared/api/media.api';
import { getMediaCategory } from './media-utils';

function PreviewContent({ media }: { media: ApiMedia }) {
  const category = getMediaCategory(media.mime_type);

  if (category === 'image') {
    return (
      <img
        src={media.url}
        alt={media.original_name}
        className="max-h-[75vh] max-w-full mx-auto rounded object-contain"
      />
    );
  }

  if (category === 'video') {
    return (
      <video
        src={media.url}
        controls
        className="max-h-[75vh] w-full rounded bg-black"
      />
    );
  }

  if (category === 'pdf') {
    return (
      <iframe
        src={media.url}
        title={media.original_name}
        className="w-full h-[75vh] rounded border-0"
      />
    );
  }

  return null;
}

interface MediaPreviewModalProps {
  media: ApiMedia | null;
  onClose: () => void;
}

export function MediaPreviewModal({ media, onClose }: MediaPreviewModalProps) {
  return (
    <Dialog open={!!media} onOpenChange={(open) => { if (!open) onClose(); }}>
      {media && (
        <DialogContent className="sm:max-w-4xl gap-3 p-4">
          <DialogHeader>
            <DialogTitle className="truncate pr-6 text-xs font-medium">
              {media.original_name}
            </DialogTitle>
          </DialogHeader>
          <PreviewContent media={media} />
        </DialogContent>
      )}
    </Dialog>
  );
}
