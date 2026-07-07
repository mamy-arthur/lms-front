import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, Building2, CalendarDays, ClipboardList, User } from 'lucide-react';

export interface FormationCardProps {
  title: string;
  author: string;
  category: string;
  coverImage?: string;
  price: number;
  updatedAt: string;
  enrolledCompanies: number;
  moduleCount: number;
  evaluationCount: number;
  className?: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function FormationCard({
  title,
  author,
  category,
  coverImage,
  price,
  updatedAt,
  enrolledCompanies,
  moduleCount,
  evaluationCount,
  className,
}: FormationCardProps) {
  const isFree = price === 0;

  return (
    <Card className={cn('overflow-hidden pt-0 cursor-pointer', className)}>
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="size-12"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-background/90 text-[0.6rem] rounded-sm">
            {category}
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2 text-sm leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4 pb-1">
          <div className="flex items-center gap-1.5 text-blue-500">
            <BookOpen className="size-3 shrink-0" />
            <span className="font-medium">
              {moduleCount} module{moduleCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600">
            <ClipboardList className="size-3 shrink-0" />
            <span className="font-medium">{evaluationCount} examens</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="size-3 shrink-0" />
          <span className="truncate">{author}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          <span>Mis à jour le {formatDate(updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-1.5text-xs text-muted-foreground">
          <div className="flex gap-1.5 items-center">
            <Building2 className="size-3 shrink-0" />
            <span>
              {enrolledCompanies} membre{enrolledCompanies !== 1 ? 's' : ''} inscrit
              {enrolledCompanies !== 1 ? 's' : ''}
            </span>
          </div>
          <div>
            {isFree ? (
              <span className="text-green-500 font-medium">Gratuit</span>
            ) : (
              <span className="bg-background/90 text-lg text-black font-medium">
                {formatPrice(price)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
