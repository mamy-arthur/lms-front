/**
 * Tests fonctionnels — LoginForm
 *
 * On teste le comportement réel du formulaire depuis le point de vue
 * de l'utilisateur (saisie, soumission, erreurs) en mockant uniquement
 * les dépendances externes (API, router Next.js, store d'authentification).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { Role } from '@/shared/constants/roles';
import type { Tenant } from '@/shared/types/tenant.types';

// ─── Polyfills pour l'environnement test ───────────────────────────────────────

// matchMedia est utilisé par certains composants UI (dark mode, responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

/** Mock de next/navigation : on contrôle le router dans les tests. */
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

/**
 * Mock complet de loginUtils.
 *
 * On N'utilise PAS jest.requireActual car cela chargerait le vrai module
 * loginUtils.ts → auth.api.ts → apiClient.ts → react-admin (package CJS qui
 * dépend de react-hotkeys-hook, un package ESM non transformé par défaut).
 *
 * L'implémentation inline de resolveRedirectPath reproduit la logique réelle ;
 * la correcte de cette logique est validée indépendamment dans loginUtils.test.ts.
 */
jest.mock('@/modules/auth/utils/loginUtils', () => ({
  resolveLogin: jest.fn(),
  clearSessionCache: jest.fn(),
  resolveRedirectPath: (user: { role: string }, hasTenant: boolean): string => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'EDITOR') return '/admin';
    return hasTenant ? '/dashboard' : '/tenant-not-found';
  },
}));
import { resolveLogin } from '@/modules/auth/utils/loginUtils';
const mockResolveLogin = jest.mocked(resolveLogin);

/**
 * Mock du store d'authentification :
 * on capture l'appel à setAuth sans effets de bord (cookie, localStorage).
 */
const mockSetAuth = jest.fn();
jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { setAuth: jest.Mock }) => unknown) =>
    selector({ setAuth: mockSetAuth }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_TENANT: Tenant = {
  id: 'tenant-001',
  slug: 'acme',
  name: 'Acme Corp',
  domain: 'acme.learneo.local',
  status: 'active',
  is_active: true,
  branding: {
    primary_color: '#7c3aed',
    secondary_color: '#a78bfa',
    logo_url: '/logo.svg',
    favicon_url: '',
    fontFamily: 'inherit',
  },
  features: { certificates: true, liveSession: true, customDomain: false },
};

const VALID_CREDENTIALS = {
  email: 'alice@acme.io',
  password: 'supersecret99',
};

const MOCK_AUTH_RESPONSE = {
  token: 'eyJhbGci.mock.token',
  user: {
    id: 'u-001',
    name: 'Alice Dupont',
    email: VALID_CREDENTIALS.email,
    role: Role.SUPER_ADMIN,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Saisit les credentials dans le formulaire et soumet. */
async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) {
  await user.type(screen.getByPlaceholderText('vous@exemple.com'), email);
  await user.type(screen.getByPlaceholderText('••••••••'), password);
  await user.click(screen.getByRole('button', { name: /connexion|se connecter/i }));
}

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialise le store tenant entre chaque test.
    useTenantStore.setState({ tenant: null, resolutionStatus: 'idle' });
  });

  // ── Rendu initial ──────────────────────────────────────────────────────────

  it('affiche le formulaire de connexion au chargement', () => {
    render(<LoginForm />);

    expect(screen.getByText('Bon retour 👋')).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connexion|se connecter/i })).toBeInTheDocument();
  });
  // ── Connexion réussie ──────────────────────────────────────────────────────
  it('appelle resolveLogin avec les credentials saisis', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(mockResolveLogin).toHaveBeenCalledWith(
        VALID_CREDENTIALS.email,
        VALID_CREDENTIALS.password,
      );
    });
  });

  it("sauvegarde l'utilisateur dans le store après connexion réussie", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(MOCK_AUTH_RESPONSE.user);
    });
  });

  it('redirige vers /admin pour un SUPER_ADMIN (avec ou sans tenant)', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
    // Pas de tenant dans le store → hasTenant = false
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin');
    });
  });

  it('redirige vers /tenant-not-found pour un TRAINEE sans tenant', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue({
      ...MOCK_AUTH_RESPONSE,
      user: { ...MOCK_AUTH_RESPONSE.user, role: Role.TRAINEE },
    });
    // Pas de tenant dans le store → hasTenant = false
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/tenant-not-found');
    });
  });

  it('redirige vers /dashboard pour un TRAINEE avec un tenant actif', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue({
      ...MOCK_AUTH_RESPONSE,
      user: { ...MOCK_AUTH_RESPONSE.user, role: Role.TRAINEE },
    });
    // Tenant présent dans le store → hasTenant = true
    useTenantStore.setState({
      tenant: MOCK_TENANT,
      resolutionStatus: 'resolved',
    });
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ── Gestion d'erreurs ──────────────────────────────────────────────────────

  it("affiche un message d'erreur si la connexion échoue", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(screen.getByText('Email ou mot de passe incorrect.')).toBeInTheDocument();
    });
  });

  // ── Interactions UI ────────────────────────────────────────────────────────

  it('bascule la visibilité du mot de passe', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', {
      name: '',
    }); // Le bouton sans texte

    // Au départ, le champ est en mode password
    expect(passwordInput.type).toBe('password');

    // Cliquer sur le bouton bascule
    await user.click(toggleButton);

    // Maintenant c'est du texte
    expect(passwordInput.type).toBe('text');

    // Cliquer encore pour revenir en mode password
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('désactive le bouton soumettre pendant la soumission', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(MOCK_AUTH_RESPONSE), 100)),
    );
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', {
      name: /connexion|se connecter/i,
    }) as HTMLButtonElement;

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });
});
