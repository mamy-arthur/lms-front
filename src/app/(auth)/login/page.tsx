import { LoginForm } from "@/modules/auth/components/LoginForm";

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;

  return (
    <div className="w-full max-w-[880px] mx-auto flex rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] min-h-[500px]">
      {/* Panneau gauche – branding */}
      <div className="hidden md:flex flex-col items-center justify-center w-[44%] bg-[#0d1642] px-10 py-14 gap-6">
        <div className="bg-[#1a237e] rounded-2xl w-32 h-28 flex items-center justify-center shadow-xl">
          <svg
            width="60"
            height="52"
            viewBox="0 0 60 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polyline
              points="4,40 22,22 34,30 56,8"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="44,8 56,8 56,20"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-white text-4xl font-bold tracking-widest">
          Learneo
        </span>
        <span className="text-white/50 text-sm text-center leading-relaxed">
          Votre plateforme e-learning multi-tenant
        </span>
      </div>

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
