import { LoginForm } from '@/modules/auth/components/LoginForm';
import { ClientLoginLayout } from '@/modules/auth/components/ClientLoginLayout';

interface Props {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;

  return (
    <ClientLoginLayout>
      <LoginForm resetSuccess={reset === '1'} />
    </ClientLoginLayout>
  );
}
