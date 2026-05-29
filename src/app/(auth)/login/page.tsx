import { LoginForm } from "@/modules/auth/components/LoginForm";
import { LoginBrandingPanel } from "@/app/(auth)/_components/LoginBrandingPanel";

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;

  return (
    <div className="w-full max-w-[880px] mx-auto flex rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] min-h-[500px]">
      {/* Panneau gauche – branding */}
      <LoginBrandingPanel />

      {/* Panneau droit – formulaire */}
      <div className="flex-1 flex flex-col justify-center bg-white px-10 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h1>
        <p className="text-sm text-gray-500 mb-8">
          Bienvenue, entrez vos identifiants pour continuer.
        </p>

        {reset === "1" && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 px-5 py-3 text-sm text-green-700">
            Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
