import Image from 'next/image';
import { AdminResetPasswordForm } from '@/modules/auth/components/AdminResetPasswordForm';
import { PASSWORD_POLICY_HINT } from '@/shared/schemas/auth.schema';

export default function AdminResetPasswordPage() {
  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md shadow-sm rounded-sm p-8 mb-8">
        <div className="mb-5 mt-8 w-40 mx-auto">
          <Image
            src="/logo.png"
            alt="Logo"
            width={160}
            height={50}
            priority
            className="h-[50px] w-auto object-contain"
          />
        </div>
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-semibold">Nouveau mot de passe</h1>
          <p className="mt-2 text-muted-foreground text-xs">{PASSWORD_POLICY_HINT}</p>
        </div>
        <AdminResetPasswordForm />
      </div>
    </section>
  );
}
