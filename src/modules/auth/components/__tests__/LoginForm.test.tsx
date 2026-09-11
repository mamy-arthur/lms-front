/**
 * Tests fonctionnels — LoginForm
 *
 * On teste le comportement réel du formulaire depuis le point de vue
 * de l'utilisateur (saisie, soumission, erreurs) en mockant uniquement
 * les dépendances externes (API, router Next.js, store d'authentification).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Role } from '@/shared/constants/roles';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { Tenant } from '@/shared/types/tenant.types';
import { LoginForm } from '../LoginForm';

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
 * Mock du client d'authentification : le remplacement de session et l'étape OTP
 * l'appellent directement, et le module réel chargerait apiClient (cf. remarque
 * sur loginUtils ci-dessus).
 */
jest.mock('@/shared/api/auth.api', () => ({
  authApi: {
    replaceSession: jest.fn(),
    twoFactorChallenge: jest.fn(),
    twoFactorResend: jest.fn(),
  },
}));

import { authApi } from '@/shared/api/auth.api';

const mockReplaceSession = jest.mocked(authApi.replaceSession);
const mockTwoFactorChallenge = jest.mocked(authApi.twoFactorChallenge);

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
  outcome: 'authenticated' as const,
  user: {
    id: 'u-001',
    name: 'Alice Dupont',
    email: VALID_CREDENTIALS.email,
    role: Role.SUPER_ADMIN,
  },
  sessionId: 'session-uuid-001',
};

const MOCK_SESSION_CONFLICT = {
  outcome: 'session_conflict' as const,
  existingSession: {
    deviceName: 'PC (Windows)',
    browser: 'Chrome',
    lastActivityAt: '2026-08-25T10:00:00Z',
  },
  replacementToken: 'replace-token-abc',
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
      expect(mockSetAuth).toHaveBeenCalledWith(
        MOCK_AUTH_RESPONSE.user,
        MOCK_AUTH_RESPONSE.sessionId,
      );
    });
  });

  it('redirige vers /admin pour un SUPER_ADMIN (avec ou sans tenant)', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
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

  // ── Conflit de session ─────────────────────────────────────────────────────

  it('affiche la modale de conflit de session sur une réponse 409', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_SESSION_CONFLICT);
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(screen.getByText('Session déjà active')).toBeInTheDocument();
    });
  });

  it("annuler la modale ne déclenche pas d'appel de remplacement", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_SESSION_CONFLICT);
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
    await waitFor(() => screen.getByText('Session déjà active'));
    await user.click(screen.getByRole('button', { name: /annuler/i }));

    expect(mockReplaceSession).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('confirmer appelle replaceSession et redirige', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_SESSION_CONFLICT);
    mockReplaceSession.mockResolvedValue({
      user: MOCK_AUTH_RESPONSE.user,
      sessionId: 'session-new-001',
    });
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
    await waitFor(() => screen.getByText('Session déjà active'));
    await user.click(screen.getByRole('button', { name: /me connecter sur cet appareil/i }));

    await waitFor(() => {
      expect(mockReplaceSession).toHaveBeenCalledWith('replace-token-abc');
      expect(mockSetAuth).toHaveBeenCalledWith(MOCK_AUTH_RESPONSE.user, 'session-new-001');
      expect(mockReplace).toHaveBeenCalledWith('/admin');
    });
  });

  // ── 2FA ────────────────────────────────────────────────────────────────────

  describe('vérification en deux étapes', () => {
    const CHALLENGE = {
      outcome: 'two_factor_required' as const,
      challenge: {
        two_factor_required: true as const,
        challenge_token: 'chal-123',
        expires_in: 600,
        code_length: 6,
        resend_cooldown_seconds: 0,
      },
    };

    it('ne change rien au parcours quand le 2FA est désactivé', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(
          MOCK_AUTH_RESPONSE.user,
          MOCK_AUTH_RESPONSE.sessionId,
        );
      });
      expect(screen.queryByText(/vérification en deux étapes/i)).not.toBeInTheDocument();
    });

    it('affiche l’étape OTP sans ouvrir de session quand un challenge est renvoyé', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

      await waitFor(() => {
        expect(screen.getByText(/vérification en deux étapes/i)).toBeInTheDocument();
      });
      expect(screen.getAllByRole('textbox')).toHaveLength(6);
      expect(mockSetAuth).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('ouvre la session après validation du code', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      mockTwoFactorChallenge.mockResolvedValue(MOCK_AUTH_RESPONSE);
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getAllByRole('textbox')[0]);
      await user.keyboard('123456');
      await user.click(screen.getByRole('button', { name: /vérifier/i }));

      await waitFor(() => {
        expect(mockTwoFactorChallenge).toHaveBeenCalledWith({
          challenge_token: 'chal-123',
          code: '123456',
          trust_device: false,
        });
      });
      expect(mockSetAuth).toHaveBeenCalledWith(
        MOCK_AUTH_RESPONSE.user,
        MOCK_AUTH_RESPONSE.sessionId,
      );
      expect(mockReplace).toHaveBeenCalledWith('/admin');
    });

    it('bascule sur la modale de conflit si une session est déjà active', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      mockTwoFactorChallenge.mockResolvedValue(MOCK_SESSION_CONFLICT);
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getAllByRole('textbox')[0]);
      await user.keyboard('123456');
      await user.click(screen.getByRole('button', { name: /vérifier/i }));

      expect(await screen.findByText('Session déjà active')).toBeInTheDocument();
      expect(mockSetAuth).not.toHaveBeenCalled();
    });

    it('transmet trust_device quand la case est cochée', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      mockTwoFactorChallenge.mockResolvedValue(MOCK_AUTH_RESPONSE);
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getAllByRole('textbox')[0]);
      await user.keyboard('123456');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /vérifier/i }));

      await waitFor(() => {
        expect(mockTwoFactorChallenge).toHaveBeenCalledWith(
          expect.objectContaining({ trust_device: true }),
        );
      });
    });

    it('desactive le renvoi tant que le cooldown du dernier envoi court', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue({
        ...CHALLENGE,
        challenge: { ...CHALLENGE.challenge, resend_cooldown_seconds: 45 },
      });
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      expect(screen.getByRole('button', { name: /renvoyer dans 45s/i })).toBeDisabled();
    });

    it('revient à la saisie du mot de passe via « Retour à la connexion »', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getByRole('button', { name: /retour à la connexion/i }));

      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
      expect(screen.queryByText(/vérification en deux étapes/i)).not.toBeInTheDocument();
    });

    it('garde l’utilisateur sur l’étape OTP quand le code est incorrect', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      mockTwoFactorChallenge.mockRejectedValue(
        Object.assign(new Error('Unprocessable'), {
          status: 422,
          headers: new Headers(),
          json: {
            message: 'Le code fourni est incorrect.',
            error_code: 'two_factor.invalid_code',
          },
        }),
      );
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getAllByRole('textbox')[0]);
      await user.keyboard('000000');
      await user.click(screen.getByRole('button', { name: /vérifier/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Le code fourni est incorrect.');
      expect(screen.getByText(/vérification en deux étapes/i)).toBeInTheDocument();
      expect(mockSetAuth).not.toHaveBeenCalled();
    });

    it('ramène à la saisie du mot de passe quand le challenge n’est plus valide', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      mockTwoFactorChallenge.mockRejectedValue(
        Object.assign(new Error('Unprocessable'), {
          status: 422,
          headers: new Headers(),
          json: {
            message: 'Ce challenge est invalide.',
            error_code: 'two_factor.invalid_challenge',
          },
        }),
      );
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getAllByRole('textbox')[0]);
      await user.keyboard('123456');
      await user.click(screen.getByRole('button', { name: /vérifier/i }));

      expect(await screen.findByText('Ce challenge est invalide.')).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    });

    it('laisse revenir à la connexion quand le compte est bloqué', async () => {
      const user = userEvent.setup();
      mockResolveLogin.mockResolvedValue(CHALLENGE);
      mockTwoFactorChallenge.mockRejectedValue(
        Object.assign(new Error('Locked'), {
          status: 423,
          headers: new Headers(),
          json: {
            message: 'Votre compte est bloqué après trop de tentatives.',
            error_code: 'two_factor.account_locked',
          },
        }),
      );
      render(<LoginForm />);

      await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
      await screen.findByText(/vérification en deux étapes/i);

      await user.click(screen.getAllByRole('textbox')[0]);
      await user.keyboard('123456');
      await user.click(screen.getByRole('button', { name: /vérifier/i }));

      await screen.findByText('Votre compte est bloqué après trop de tentatives.');

      await user.click(screen.getByRole('button', { name: /retour à la connexion/i }));

      expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    });
  });

  // ── Gestion d'erreurs ──────────────────────────────────────────────────────

  it('affiche un message générique quand les identifiants sont refusés', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        status: 401,
        headers: new Headers(),
        json: {},
      }),
    );
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    await waitFor(() => {
      expect(screen.getByText('Email ou mot de passe incorrect.')).toBeInTheDocument();
    });
  });

  it('annonce le blocage du compte au lieu d’une erreur de saisie (423)', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockRejectedValue(
      Object.assign(new Error('Locked'), {
        status: 423,
        headers: new Headers(),
        json: { message: 'Votre compte est bloqué après trop de tentatives.' },
      }),
    );
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    expect(
      await screen.findByText('Votre compte est bloqué après trop de tentatives.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Email ou mot de passe incorrect.')).not.toBeInTheDocument();
  });

  it('indique le délai d’attente quand la connexion est limitée en débit (429)', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockRejectedValue(
      Object.assign(new Error('Too Many Requests'), {
        status: 429,
        headers: new Headers({ 'Retry-After': '120' }),
        json: {},
      }),
    );
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    expect(await screen.findByText(/trop de tentatives de connexion/i)).toHaveTextContent(
      '2 minutes',
    );
  });

  it('distingue une panne réseau d’un refus d’identifiants', async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<LoginForm />);

    await fillAndSubmit(user, VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);

    expect(await screen.findByText(/impossible de joindre le serveur/i)).toBeInTheDocument();
    expect(screen.queryByText('Email ou mot de passe incorrect.')).not.toBeInTheDocument();
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
