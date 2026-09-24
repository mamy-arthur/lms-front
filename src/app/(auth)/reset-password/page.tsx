import Link from 'next/link';
import { LoginBrandingPanel } from '@/app/(auth)/_components/LoginBrandingPanel';
import { ResetPasswordForm } from '@/modules/auth/components/ResetPasswordForm';
import { ROUTES } from '@/shared/constants/routes';
import { PASSWORD_POLICY_HINT } from '@/shared/schemas/auth.schema';

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  return (
    <main className="min-h-screen bg-background w-full">
      <div className="grid min-h-screen lg:grid-cols-2">
        <LoginBrandingPanel />

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            {!token || !email ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-bold">Lien invalide</h1>

                  <p className="mt-2 text-muted-foreground text-sm">
                    Ce lien de réinitialisation est invalide ou a expiré.
                  </p>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  <Link
                    href={ROUTES.auth.forgotPassword}
                    className="font-semibold text-primary hover:underline"
                  >
                    Faire une nouvelle demande
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>

                  <p className="mt-2 text-muted-foreground text-sm">{PASSWORD_POLICY_HINT}</p>
                </div>

                <ResetPasswordForm email={email} token={token} />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
