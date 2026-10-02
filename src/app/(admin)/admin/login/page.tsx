import { PlatformLoginForm } from '@/modules/auth/components/PlatformLoginForm';

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function PlatformLoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;

  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md shadow-sm rounded-sm p-8 mb-8">
        <div className="mb-5 mt-8 w-40 mx-auto">
          <img src="/logo.png" alt="Logo" className="h-[50px] w-auto object-contain" />
        </div>
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-semibold">Bon retour</h1>
          <p className="mt-2 text-muted-foreground text-xs">
            Connectez-vous à votre espace d'Administration.
          </p>
        </div>
        <PlatformLoginForm resetSuccess={reset === '1'} />
      </div>
    </section>
  );
}
