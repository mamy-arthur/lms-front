import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CartQuantityControls } from '@/modules/shared/components/store/CartQuantityControls';
import { BookOpen, Users, CalendarDays, ClipboardList, ShoppingCart } from 'lucide-react';
import { learningPathCover } from '@/shared/lib/learning-path-cover';

export interface FormationCardProps {
  id?: string;
  title: string;
  description?: string | null;
  author: string;
  category: string;
  coverImage?: string;
  price: number;
  updatedAt: string;
  enrolledCompanies: number;
  moduleCount: number;
  evaluationCount: number;
  hasCertificate?: boolean;
  className?: string;
  onAddToCart?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  /** Si défini, remplace le bouton d'ajout par le contrôle de quantité. */
  cartQuantity?: number;
  onIncreaseQuantity?: () => void;
  onDecreaseQuantity?: () => void;
  onQuantityChange?: (quantity: number) => void;
  isCartMutating?: boolean;
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
  description,
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
  cartQuantity,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onQuantityChange,
  isCartMutating = false,
}: FormationCardProps) {
  const isFree = price === 0;
  const isClickable = Boolean(onOpenDetails && id);
  const isInCart = typeof cartQuantity === 'number' && cartQuantity > 0;

  const handleOpenDetails = () => {
    if (!isClickable || !onOpenDetails) {
      return;
    }

    onOpenDetails(id ?? '');
  };

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md rounded-sm',
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
        <img
          src={learningPathCover(coverImage)}
          alt={title}
          className="h-full w-full object-cover"
        />

        <div className="absolute bottom-2 left-2">
          {category && (
            <Badge variant="secondary" className="rounded-sm bg-background/90 text-xs">
              {category}
            </Badge>
          )}
        </div>
      </div>

      <CardHeader>
        <CardTitle className="flex gap-2 text-sm leading-snug">
          <span className="line-clamp-2">{title}</span>
        </CardTitle>
        {description && (
          <p className="line-clamp-2 text-[12px] text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 text-xs text-muted-foreground -mt-1">
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
          <CalendarDays className="size-3.5 shrink-0" />
          <span>Mis à jour le {formatDate(updatedAt)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 shrink-0" />
          <span>
            {enrolledCompanies} membre{enrolledCompanies !== 1 ? 's' : ''} inscrit
            {enrolledCompanies !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-3 items-center gap-2 pt-3">
          <div className="col-span-1">
            {isFree ? (
              <span className="font-semibold text-foreground">Gratuit</span>
            ) : (
              <span className="bg-background/90 text-lg font-medium text-foreground">
                {formatPrice(price)}
              </span>
            )}
          </div>

          <div className="col-span-2 flex items-center justify-end gap-2">
            {isInCart && onIncreaseQuantity && onDecreaseQuantity ? (
              <div
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <CartQuantityControls
                  quantity={cartQuantity}
                  onDecrease={onDecreaseQuantity}
                  onIncrease={onIncreaseQuantity}
                  onQuantityChange={onQuantityChange}
                  disabled={isCartMutating}
                />
              </div>
            ) : (
              onAddToCart && (
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
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
