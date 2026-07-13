import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  ImageIcon,
  ShoppingCart,
  User,
} from 'lucide-react';

export interface FormationCardProps {
  id?: string;
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
  onAddToCart?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
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
  id,
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
  onAddToCart,
  onOpenDetails,
}: FormationCardProps) {
  const isFree = price === 0;
  const isClickable = Boolean(onOpenDetails && id);

  const handleOpenDetails = () => {
    if (!isClickable || !onOpenDetails) {
      return;
    }

    onOpenDetails(id ?? '');
  };

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md',
        isClickable && 'cursor-pointer',
        className,
      )}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleOpenDetails}
      onKeyDown={(event) => {
        if (!isClickable) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpenDetails();
        }
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className="size-12" strokeWidth={1} />
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="rounded-sm bg-background/90 text-xs">
            {category}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-sm leading-snug">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1 pb-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-sm px-2.5 py-1 font-medium">
              <BookOpen className="mr-1 size-3.5" />
              {moduleCount} module{moduleCount > 1 ? 's' : ''}
            </Badge>

            <Badge variant="secondary" className="rounded-sm px-2.5 py-1 font-medium">
              <ClipboardList className="mr-1 size-3.5" />
              {evaluationCount} examen{evaluationCount > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{author}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>Mis à jour le {formatDate(updatedAt)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Building2 className="size-3.5 shrink-0" />
          <span>
            {enrolledCompanies} membre{enrolledCompanies !== 1 ? 's' : ''} inscrit
            {enrolledCompanies !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-3 items-center gap-2 pt-3">
          <div className="col-span-1">
            {isFree ? (
              <span className="font-semibold text-primary">Gratuit</span>
            ) : (
              <span className="bg-background/90 text-lg font-medium text-foreground">
                {formatPrice(price)}
              </span>
            )}
          </div>

          <div className="col-span-2 flex gap-2">
            {onAddToCart && (
              <Button
                className="w-full gap-1.5 p-4 bg-(--color-primary) hover:bg-(--color-primary)/80"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddToCart(id ?? '');
                }}
              >
                <ShoppingCart className="size-3.5" />
                Ajouter au panier
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
