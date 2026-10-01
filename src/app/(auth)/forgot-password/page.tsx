import { LoginBrandingPanel } from '@/app/(auth)/_components/LoginBrandingPanel';
import { ForgotPasswordForm } from '@/modules/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background w-full">
      <div className="grid min-h-screen lg:grid-cols-2">
        <LoginBrandingPanel />

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div>
              <h1 className="text-3xl font-bold">Mot de passe oublié</h1>

              <p className="mt-2 text-muted-foreground text-sm">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            <ForgotPasswordForm />
          </div>
        </section>
      </div>
    </main>
  );
}
