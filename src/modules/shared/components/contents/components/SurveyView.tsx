import ReactMarkdown from 'react-markdown';
import { ClipboardList } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CONTENT_TYPE_META } from '@/modules/shared/components/courses/types';

interface SurveyContentViewProps {
  title: string;
  surveyType: string;
  description?: string;
}

const SURVEY_TYPES = {
  attls: 'ATTLS',
  colles: 'COLLES',
  'critical-incidents': 'Incidents critiques',
};

export function SurveyContentView({ title, surveyType, description }: SurveyContentViewProps) {
  const type = CONTENT_TYPE_META['survey'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="size-4 text-muted-foreground" />
            <CardTitle className="text-xs">{title}</CardTitle>
          </div>

          <Badge className={type.bgColor}>{type.label}</Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Type :</span>
          <Badge variant="secondary" className="bg-fuchsia-600 text-white">
            {SURVEY_TYPES[surveyType as keyof typeof SURVEY_TYPES]}
          </Badge>
        </div>
        {description && (
          <div className="react-markdown prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
        <div className="rounded-lg border bg-gray-100/20 p-2">
          <p className="text-xs text-muted-foreground">
            Les participants pourront répondre à ce sondage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
