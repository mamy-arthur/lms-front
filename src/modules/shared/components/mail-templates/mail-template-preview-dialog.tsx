'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface MailTemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  name: string;
  /** HTML body déjà résolu (images src résolues, variables non substituées). */
  body: string;
}

export function MailTemplatePreviewDialog({
  open,
  onClose,
  name,
  body,
}: MailTemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex flex-col gap-0 p-0 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-4xl h-[90vh] sm:h-[85vh]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-4 py-3 shrink-0">
          <DialogTitle className="text-sm font-medium truncate pr-8">Aperçu — {name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5"
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: contenu HTML contrôlé côté backend */
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
