import { LoginForm } from '@/modules/auth/components/LoginForm';
import { LoginBrandingPanel } from '@/app/(auth)/_components/LoginBrandingPanel';

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  await searchParams;

  return (
    <main className="min-h-screen bg-background w-full">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <LoginBrandingPanel />
        {/* RIGHT SIDE */}
        <LoginForm />
      </div>
    </main>
  );
}
