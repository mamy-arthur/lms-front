import { RichTextRenderer } from '@/shared/components/RichTextRenderer';
import { ExternalLink, Globe } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CONTENT_TYPE_META } from '@/modules/shared/components/courses/types';

interface UrlContentViewProps {
  title: string;
  description?: string;
  url?: string;
}

export function UrlContentView({ title, description, url }: UrlContentViewProps) {
  const type = CONTENT_TYPE_META['url'];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xs">{title || 'Lien externe'}</CardTitle>

          <Badge className={type.bgColor}>{type.label}</Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6">
        {description && <RichTextRenderer content={description} />}

        {url && (
          <div className="bg-muted/30 rounded-lg border p-4 flex justify-between items-center">
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 size-5 text-muted-foreground" />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">Ressource externe</p>

                <p className="break-all text-xs">
                  <a href={url} className="text-blue-600 underline">
                    {url}
                  </a>
                </p>
              </div>
            </div>

            <Button className=" bg-blue-600 hover:bg-blue-600/80 text-xs" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
