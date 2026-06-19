import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white px-10 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Mot de passe oublié
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
