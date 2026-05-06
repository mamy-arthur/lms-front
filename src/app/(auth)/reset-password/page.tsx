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
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
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
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
      <p className="text-sm text-gray-500 mb-6">Choisissez un mot de passe d'au moins 8 caractères.</p>
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}
