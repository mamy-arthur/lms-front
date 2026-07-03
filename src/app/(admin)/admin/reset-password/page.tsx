import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminResetPasswordForm } from '@/modules/auth/components/AdminResetPasswordForm';

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réinitialiser le mot de passe</CardTitle>
        </CardHeader>

        <CardContent>
          <AdminResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
