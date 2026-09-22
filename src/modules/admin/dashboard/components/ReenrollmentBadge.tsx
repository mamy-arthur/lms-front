import { Badge } from '@/components/ui/badge';

/** Prepared for the enrollment panel; never derive this number from a filtered list. */
export function ReenrollmentBadge({ number }: { number: number }) {
  if (number < 1) return null;

  return (
    <Badge variant="outline" className="text-xs">
      Réinscription {number}
    </Badge>
  );
}
