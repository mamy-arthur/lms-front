'use client';

import { sanitizeHtml } from '@/lib/sanitize-html';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  className?: string;
}

export function RichTextRenderer({ content, className }: Props) {
  return (
    <div
      className={cn('richtext-content prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}
