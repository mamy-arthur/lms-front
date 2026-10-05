import { LoginForm } from '@/modules/auth/components/LoginForm';
import { ClientLoginLayout } from '@/modules/auth/components/ClientLoginLayout';

interface Props {
  searchParams: Promise<{ reset?: string; activated?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { reset, activated } = await searchParams;

  return (
    <ClientLoginLayout>
      <LoginForm resetSuccess={reset === '1'} activationSuccess={activated === '1'} />
    </ClientLoginLayout>
  );
}
