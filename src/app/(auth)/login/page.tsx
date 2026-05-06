import { LoginForm } from "@/modules/auth/components/LoginForm";

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      {reset === "1" && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h1>
      <p className="text-sm text-gray-500 mb-6">Bienvenue, entrez vos identifiants pour continuer.</p>
      <LoginForm />
    </div>
  );
}
