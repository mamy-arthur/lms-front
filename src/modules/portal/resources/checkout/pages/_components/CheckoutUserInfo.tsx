import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CheckoutUserInfoProps {
  name: string;
  email: string;
}

export function CheckoutUserInfo({ name, email }: CheckoutUserInfoProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xs font-semibold">Vos informations</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="checkout-name">Nom complet</Label>
          <Input
            id="checkout-name"
            value={name}
            readOnly
            className="h-8 rounded-lg bg-muted/40 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkout-email">Adresse e-mail</Label>
          <Input
            id="checkout-email"
            type="email"
            value={email}
            readOnly
            className="h-8 rounded-lg bg-muted/40 text-xs"
          />
        </div>
      </div>
    </section>
  );
}
