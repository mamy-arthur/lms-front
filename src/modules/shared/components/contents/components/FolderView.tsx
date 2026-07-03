import ReactMarkdown from 'react-markdown';
import { Folder, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CONTENT_TYPE_META } from '@/modules/shared/components/courses/types';

interface FolderContentViewProps {
  title: string;
  description?: string;
  fileCount?: number;
  filesNames?: string[];
}

export function FolderContentView({
  title,
  description,
  fileCount,
  filesNames = [],
}: FolderContentViewProps) {
  const type = CONTENT_TYPE_META['folder'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Folder className="size-4 text-muted-foreground" />
            <CardTitle className="text-xs">{title || 'Dossier'}</CardTitle>
          </div>

          <Badge className={type.bgColor}>{type.label}</Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6">
        {description && (
          <div className="react-markdown prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}

        <div className="rounded-lg border">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <Folder className="size-4" />

              <span className="font-medium">{fileCount ?? filesNames.length} fichier(s)</span>
            </div>
          </div>

          <div className="divide-y">
            {filesNames.map((file) => (
              <div key={file} className="flex items-center gap-3 p-3">
                <FileText className="size-4 text-muted-foreground" />

                <span className="text-xs">{file}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
