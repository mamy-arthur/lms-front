import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { LayoutSideBar } from '@/modules/shared/layout/AppSidebar';
import { AppSidebar } from '../app-sidebar';

jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: jest.fn() }));
jest.mock('../nav-main', () => ({ NavMain: () => <nav aria-label="Menu principal" /> }));
jest.mock('../dev-banner', () => ({ DevBanner: () => null }));
jest.mock('../app-header', () => ({ AppHeader: () => null }));

const mockUseIsMobile = jest.mocked(useIsMobile);
const LOGO = 'https://assets.example.test/acme.svg';

describe('Identité de la sidebar', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it('affiche un logo compact et le nom transmis par le layout', () => {
    render(
      <LayoutSideBar
        navItems={[]}
        user={null}
        logoUrl={LOGO}
        tenantName="Acme Formation"
        onLogout={jest.fn()}
      >
        Contenu
      </LayoutSideBar>,
    );

    const logo = screen.getByRole('img', { name: 'Logo de Acme Formation' });
    expect(logo).toHaveAttribute('src', LOGO);
    expect(logo).toHaveAttribute('width', '32');
    expect(logo).toHaveAttribute('height', '32');
    expect(logo).toHaveClass('size-8', 'shrink-0', 'object-contain');
    expect(screen.getByText('Acme Formation').parentElement).toBe(logo.parentElement);
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
  });

  it.each([undefined, null, '', '   '])(
    'affiche le logo par défaut sans logo configuré (%s)',
    (logoUrl) => {
      render(
        <SidebarProvider>
          <AppSidebar logoUrl={logoUrl} tenantName="Acme" />
        </SidebarProvider>,
      );

      expect(screen.getByRole('img', { name: 'Logo de Acme' })).toHaveAttribute(
        'src',
        '/logo-default.svg',
      );
      expect(screen.getByText('Acme')).toBeInTheDocument();
    },
  );

  it('nettoie les espaces autour du nom et de l’URL', () => {
    render(
      <SidebarProvider>
        <AppSidebar logoUrl={`  ${LOGO}  `} tenantName="  Acme  " />
      </SidebarProvider>,
    );

    expect(screen.getByRole('img', { name: 'Logo de Acme' })).toHaveAttribute('src', LOGO);
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('affiche Learneo en l’absence de tenant', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.getByRole('img', { name: 'Logo de Learneo' })).toHaveAttribute(
      'src',
      '/logo-default.svg',
    );
    expect(screen.getByText('Learneo')).toBeInTheDocument();
  });

  it('utilise le repli en cas d’erreur sans bloquer le chargement d’un nouveau logo', () => {
    const { rerender } = render(
      <SidebarProvider>
        <AppSidebar logoUrl={LOGO} tenantName="Acme" />
      </SidebarProvider>,
    );
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/logo-default.svg');
    expect(screen.getByText('Acme')).toBeInTheDocument();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/logo-default.svg');

    rerender(
      <SidebarProvider>
        <AppSidebar logoUrl="/new-logo.png" tenantName="Autre tenant" />
      </SidebarProvider>,
    );
    // next/image may normalize a relative src after its error handler has run.
    expect(screen.getByRole('img', { name: 'Logo de Autre tenant' })).toHaveProperty(
      'src',
      new URL('/new-logo.png', window.location.href).href,
    );
  });

  it('tronque les noms longs sans agrandir le logo', () => {
    const name = 'Organisation avec un nom particulièrement long';
    render(
      <SidebarProvider>
        <AppSidebar tenantName={name} />
      </SidebarProvider>,
    );

    expect(screen.getByText(name)).toHaveClass('truncate', 'min-w-0');
    expect(screen.getByRole('img').parentElement).toHaveAttribute('title', name);
  });

  it('garde le logo seul en mode réduit et réaffiche le nom à l’ouverture', async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider defaultOpen={false}>
        <AppSidebar tenantName="Acme" />
      </SidebarProvider>,
    );

    expect(screen.getByRole('img', { name: 'Logo de Acme' })).toBeInTheDocument();
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('affiche le nom sur mobile même si la sidebar ordinateur était réduite', async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <SidebarProvider defaultOpen={false}>
        <SidebarTrigger aria-label="Ouvrir le menu" />
        <AppSidebar tenantName="Acme" />
      </SidebarProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(screen.getByText('Acme')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Logo de Acme' })).toBeVisible();
  });
});
