import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
      <p className="text-sm text-gray-500 mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
