import ReactMarkdown from 'react-markdown';
import { Package, PlayCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CONTENT_TYPE_META } from '@/modules/shared/components/courses/types';

interface ScormContentViewProps {
  title: string;
  description?: string;
  packageFile?: string;
  launchUrl?: string;
}

export function ScormContentView({
  title,
  description,
  packageFile,
  launchUrl,
}: ScormContentViewProps) {
  const type = CONTENT_TYPE_META['scorm'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Package className="size-4 text-muted-foreground" />

            <CardTitle className="text-xs">{title}</CardTitle>
          </div>

          <Badge className={type.bgColor}>{type.label}</Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6">
        {description && (
          <div
            className="
                            react-markdown
                            prose
                            prose-sm
                            dark:prose-invert
                            max-w-none
                            [&_ol]:list-decimal
                            [&_ol]:pl-6
                            [&_ul]:list-disc
                            [&_ul]:pl-6
                        "
          >
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}

        {launchUrl ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              <iframe src={launchUrl} title={title} className="h-175 w-full" allowFullScreen />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/20 p-6">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">Module SCORM</p>
                {packageFile && <p className="text-xs text-muted-foreground">{packageFile}</p>}

                <p className="text-xs mt-4 text-muted-foreground">
                  Le module sera disponible après l'enregistrement et le traitement du package.
                </p>
              </div>
            </div>

            <Button variant="outline" disabled className="mt-4">
              <PlayCircle className="mr-2 size-4" />
              Lancer le module
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
