import { fireEvent, render, screen } from '@testing-library/react';
import { useTenant } from '@/shared/hooks/useTenant';
import { ClientLoginLayout } from '../ClientLoginLayout';

jest.mock('@/shared/hooks/useTenant', () => ({ useTenant: jest.fn() }));

const mockUseTenant = jest.mocked(useTenant);
const defaultTenant: ReturnType<typeof useTenant> = {
  tenant: null,
  tenantName: 'Acme Formation',
  branding: {
    primary_color: '#7c3aed',
    secondary_color: '#a78bfa',
    logo_url: 'https://assets.example.test/acme.svg',
    favicon_url: '',
    fontFamily: 'inherit',
  },
  features: undefined,
  logoUrl: 'https://assets.example.test/acme.svg',
  isCentralMode: false,
  isResolved: true,
  isLoading: false,
};

describe('ClientLoginLayout', () => {
  beforeEach(() => {
    mockUseTenant.mockReturnValue(defaultTenant);
  });

  it('affiche le nom et le logo du client sans remplacer la couleur globale', () => {
    render(
      <ClientLoginLayout>
        <h1>Formulaire de connexion</h1>
      </ClientLoginLayout>,
    );

    expect(screen.getByText('Acme Formation')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Acme Formation' })).toHaveAttribute(
      'src',
      defaultTenant.branding?.logo_url,
    );
    expect(screen.getByRole('main')).not.toHaveAttribute('style');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Formulaire de connexion');
    expect(screen.getByRole('complementary')).toHaveAccessibleName(
      'Chaque jour, un peu plus loin.',
    );
  });

  it('garde une identité lisible sans logo ni branding', () => {
    mockUseTenant.mockReturnValue({ ...defaultTenant, tenantName: 'Learneo', branding: undefined });
    render(<ClientLoginLayout>Formulaire</ClientLoginLayout>);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Learneo', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveAttribute('style');
  });

  it('ne tente pas de charger une URL de logo vide', () => {
    mockUseTenant.mockReturnValue({
      ...defaultTenant,
      branding: { ...defaultTenant.branding!, logo_url: '  ' },
    });
    render(<ClientLoginLayout>Formulaire</ClientLoginLayout>);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Acme Formation')).toBeInTheDocument();
  });

  it('remplace un logo indisponible sans perdre le nom du client et accepte un nouveau logo', () => {
    const { rerender } = render(<ClientLoginLayout>Formulaire</ClientLoginLayout>);
    fireEvent.error(screen.getByRole('img', { name: 'Acme Formation' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Acme Formation')).toBeInTheDocument();

    mockUseTenant.mockReturnValue({
      ...defaultTenant,
      branding: { ...defaultTenant.branding!, logo_url: 'https://assets.example.test/new.svg' },
    });
    rerender(<ClientLoginLayout>Formulaire</ClientLoginLayout>);
    expect(screen.getByRole('img', { name: 'Acme Formation' })).toHaveAttribute(
      'src',
      'https://assets.example.test/new.svg',
    );
  });
});
