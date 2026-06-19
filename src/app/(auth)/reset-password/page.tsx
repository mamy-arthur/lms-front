import Link from "next/link";
import { ResetPasswordForm } from "@/modules/auth/components/ResetPasswordForm";
import { ROUTES } from "@/shared/constants/routes";

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl bg-white px-10 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.45)] space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Lien invalide</h1>
        <p className="text-sm text-gray-500">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link
          href={ROUTES.auth.forgotPassword}
          className="block text-sm text-blue-600 hover:underline"
        >
          Faire une nouvelle demande
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white px-10 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Nouveau mot de passe
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Choisissez un mot de passe d'au moins 8 caractères.
      </p>
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}
