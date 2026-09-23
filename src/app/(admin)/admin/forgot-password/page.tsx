import { AdminForgotPasswordForm } from '@/modules/auth/components/AdminForgotPasswordForm';

export default function AdminForgotPasswordPage() {
  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md shadow-sm rounded-sm p-8 mb-8">
        <div className="mb-5 mt-8 w-40 mx-auto">
          <img src="/logo.png" alt="Logo" className="h-[50px] w-auto object-contain" />
        </div>
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-semibold">Mot de passe oublié</h1>
          <p className="mt-2 text-muted-foreground text-xs">
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        <AdminForgotPasswordForm />
      </div>
    </section>
  );
}
