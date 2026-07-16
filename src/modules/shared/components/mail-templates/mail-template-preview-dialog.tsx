'use client';

import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface MailTemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  name: string;
  /** Référence du template, affichée dans le header. */
  reference?: string;
  /** HTML body déjà résolu (images src résolues, variables non substituées). */
  body: string;
}

export function MailTemplatePreviewDialog({
  open,
  onClose,
  name,
  reference,
  body,
}: MailTemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="flex flex-col gap-0 p-0 w-full max-w-[calc(100%-2rem)] sm:max-w-3xl md:max-w-6xl h-[90vh] sm:h-[85vh]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-4 py-3 shrink-0">
          <DialogTitle className="text-sm font-medium truncate pr-8">
            Aperçu —{' '}
            {reference && (
              <span className="text-muted-foreground font-normal mr-1">[{reference}]</span>
            )}
            {name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-w-0">
          <div
            className="prose prose-sm max-w-none dark:prose-invert [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:table-fixed [&_td]:wrap-break-word [&_th]:wrap-break-word **:max-w-full [&_*]:!height-auto"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(body, {
                USE_PROFILES: { html: true, svg: true, svgFilters: true },
                ADD_ATTR: ['style', 'width', 'height', 'data-media-id'],
              }),
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
