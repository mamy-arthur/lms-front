import { render, screen } from '@testing-library/react';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';
import ActivateAccountPage from '@/app/(auth)/activate-account/page';

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('@/shared/api/auth.api', () => ({
  authApi: { resetPassword: jest.fn(), activateAccount: jest.fn() },
}));
jest.mock('@/shared/hooks/useTenant', () => ({
  useTenant: () => ({ tenantName: 'Acme Formation', branding: undefined }),
}));

describe.each([
  {
    name: 'reset',
    Page: ResetPasswordPage,
    title: 'Nouveau mot de passe',
    recovery: '/forgot-password',
  },
  {
    name: 'activation',
    Page: ActivateAccountPage,
    title: 'Activez votre compte',
    recovery: '/login',
  },
])('$name page', ({ Page, title, recovery }) => {
  it('renders the form inside the shared client layout', async () => {
    const { container } = render(
      await Page({
        searchParams: Promise.resolve({ token: 'test-token', email: 'alice@example.test' }),
      }),
    );

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('complementary')).toHaveAccessibleName(
      'Chaque jour, un peu plus loin.',
    );
    expect(screen.getByText('Acme Formation')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
    expect(container.querySelector('input[name="token"]')).toHaveValue('test-token');
    expect(container.querySelector('input[name="email"]')).toHaveValue('alice@example.test');
  });

  it.each([{}, { email: 'alice@example.test' }, { token: 'test-token' }])(
    'keeps the shared layout for an invalid link: %j',
    async (params) => {
      const { container } = render(await Page({ searchParams: Promise.resolve(params) }));

      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/invalide/);
      expect(container.querySelector('form')).not.toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', recovery);
    },
  );
});
