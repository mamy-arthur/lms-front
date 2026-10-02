import Link from 'next/link';
import { LoginBrandingPanel } from '@/app/(auth)/_components/LoginBrandingPanel';
import { ActivateAccountForm } from '@/modules/auth/components/ActivateAccountForm';
import { ROUTES } from '@/shared/constants/routes';
import { PASSWORD_POLICY_HINT } from '@/shared/schemas/auth.schema';

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ActivateAccountPage({ searchParams }: Props) {
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
                  <h1 className="text-3xl font-bold">Lien d&apos;activation invalide</h1>

                  <p className="mt-2 text-muted-foreground text-sm">
                    Ce lien d&apos;activation est invalide ou a expiré. Rapprochez-vous de votre
                    administrateur pour recevoir un nouveau mail d&apos;activation.
                  </p>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  <Link
                    href={ROUTES.auth.login}
                    className="font-semibold text-primary hover:underline"
                  >
                    Retour à la connexion
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl font-bold">Activez votre compte</h1>

                  <p className="mt-2 text-muted-foreground text-sm">{PASSWORD_POLICY_HINT}</p>
                </div>

                <ActivateAccountForm email={email} token={token} />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
