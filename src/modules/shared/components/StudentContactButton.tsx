import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { studentMailto } from '../lib/studentMailto';

export function StudentContactButton({ email }: { email: string | null }) {
  const href = studentMailto(email);
  if (!href) return null;

  return (
    <Button asChild variant="outline" size="sm" className="h-7 shrink-0 px-2 text-xs">
      <a href={href}>
        <Mail aria-hidden="true" className="size-3.5" />
        Contacter l’étudiant
      </a>
    </Button>
  );
}
