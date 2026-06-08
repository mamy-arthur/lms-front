/**
 * Tests fonctionnels — LoginForm
 *
 * On teste le comportement réel du formulaire depuis le point de vue
 * de l'utilisateur (saisie, soumission, erreurs) en mockant uniquement
 * les dépendances externes (API, router Next.js, store d'authentification).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";
import { useTenantStore } from "@/shared/stores/tenant.store";
import { Role } from "@/shared/constants/roles";
import type { Tenant } from "@/shared/types/tenant.types";

// ─── Mocks ────────────────────────────────────────────────────────────────────

/** Mock de next/navigation : on contrôle le router dans les tests. */
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
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
jest.mock("@/modules/auth/utils/loginUtils", () => ({
  resolveLogin: jest.fn(),
  resolveRedirectPath: (user: { role: string }, hasTenant: boolean): string => {
    if (user.role === "SUPER_ADMIN" || user.role === "EDITOR") return "/admin";
    return hasTenant ? "/dashboard" : "/tenant-not-found";
  },
}));
import { resolveLogin } from "@/modules/auth/utils/loginUtils";
const mockResolveLogin = jest.mocked(resolveLogin);

/**
 * Mock du store d'authentification :
 * on capture l'appel à setAuth sans effets de bord (cookie, localStorage).
 */
const mockSetAuth = jest.fn();
jest.mock("@/shared/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { setAuth: jest.Mock }) => unknown) =>
    selector({ setAuth: mockSetAuth }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_TENANT: Tenant = {
  id: "tenant-001",
  slug: "acme",
  name: "Acme Corp",
  domain: "acme.learneo.local",
  status: "active",
  is_active: true,
  branding: {
    primaryColor: "#7c3aed",
    secondaryColor: "#a78bfa",
    logoUrl: "/logo.svg",
    faviconUrl: "",
    fontFamily: "inherit",
  },
  features: { certificates: true, liveSession: true, customDomain: false },
};

const VALID_CREDENTIALS = {
  email: "alice@acme.io",
  password: "supersecret99",
};

const MOCK_AUTH_RESPONSE = {
  token: "eyJhbGci.mock.token",
  user: {
    id: "u-001",
    name: "Alice Dupont",
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
  await user.type(screen.getByPlaceholderText("vous@exemple.com"), email);
  await user.type(screen.getByPlaceholderText("••••••••"), password);
  await user.click(screen.getByRole("button", { name: /connexion/i }));
}

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialise le store tenant entre chaque test.
    useTenantStore.setState({ tenant: null, resolutionStatus: "idle" });
  });

  // ── Rendu initial ──────────────────────────────────────────────────────────

  it("affiche les champs email, mot de passe et le bouton de connexion", () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText("vous@exemple.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /connexion/i }),
    ).toBeInTheDocument();
  });

  it("affiche le lien « mot de passe oublié »", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("link", { name: /mot de passe oublié/i }),
    ).toBeInTheDocument();
  });

  // ── Validation côté client ─────────────────────────────────────────────────

  it("affiche les erreurs de validation si le formulaire est soumis vide", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /connexion/i }));

    await waitFor(() => {
      expect(screen.getByText("Email invalide")).toBeInTheDocument();
      expect(screen.getByText("Minimum 8 caractères")).toBeInTheDocument();
    });

    // L'API ne doit pas être appelée si la validation échoue.
    expect(mockResolveLogin).not.toHaveBeenCalled();
  });

  it("affiche une erreur si l'email est invalide", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText("vous@exemple.com"),
      "pas-un-email",
    );
    await user.click(screen.getByRole("button", { name: /connexion/i }));

    await waitFor(() => {
      expect(screen.getByText("Email invalide")).toBeInTheDocument();
    });
  });

  // ── Connexion réussie ──────────────────────────────────────────────────────

  it("appelle resolveLogin avec les credentials saisis", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
    render(<LoginForm />);

    await fillAndSubmit(
      user,
      VALID_CREDENTIALS.email,
      VALID_CREDENTIALS.password,
    );

    await waitFor(() => {
      expect(mockResolveLogin).toHaveBeenCalledWith(
        VALID_CREDENTIALS.email,
        VALID_CREDENTIALS.password,
      );
    });
  });

  it("appelle setAuth avec l'utilisateur reçu (sans token)", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
    render(<LoginForm />);

    await fillAndSubmit(
      user,
      VALID_CREDENTIALS.email,
      VALID_CREDENTIALS.password,
    );

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(MOCK_AUTH_RESPONSE.user);
    });
  });

  it("redirige vers /admin pour un SUPER_ADMIN (avec ou sans tenant)", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue(MOCK_AUTH_RESPONSE);
    // Pas de tenant dans le store → hasTenant = false
    render(<LoginForm />);

    await fillAndSubmit(
      user,
      VALID_CREDENTIALS.email,
      VALID_CREDENTIALS.password,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin");
    });
  });

  it("redirige vers /tenant-not-found pour un TRAINEE sans tenant", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue({
      ...MOCK_AUTH_RESPONSE,
      user: { ...MOCK_AUTH_RESPONSE.user, role: Role.TRAINEE },
    });
    // Pas de tenant dans le store → hasTenant = false
    render(<LoginForm />);

    await fillAndSubmit(
      user,
      VALID_CREDENTIALS.email,
      VALID_CREDENTIALS.password,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/tenant-not-found");
    });
  });

  it("redirige vers /dashboard pour un TRAINEE avec un tenant actif", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockResolvedValue({
      ...MOCK_AUTH_RESPONSE,
      user: { ...MOCK_AUTH_RESPONSE.user, role: Role.TRAINEE },
    });
    // Tenant présent dans le store → hasTenant = true
    useTenantStore.setState({
      tenant: MOCK_TENANT,
      resolutionStatus: "resolved",
    });
    render(<LoginForm />);

    await fillAndSubmit(
      user,
      VALID_CREDENTIALS.email,
      VALID_CREDENTIALS.password,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  // ── Gestion des erreurs serveur ────────────────────────────────────────────

  it("affiche le message d'erreur serveur si l'API rejette", async () => {
    const user = userEvent.setup();
    mockResolveLogin.mockRejectedValue(new Error("Unauthorized"));
    render(<LoginForm />);

    await fillAndSubmit(user, "bad@example.com", "wrongpassword");

    await waitFor(() => {
      expect(
        screen.getByText("Email ou mot de passe incorrect."),
      ).toBeInTheDocument();
    });
    // Ne redirige pas en cas d'erreur.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("n'affiche plus l'erreur serveur à la prochaine soumission", async () => {
    const user = userEvent.setup();
    // Premier appel → erreur
    mockResolveLogin.mockRejectedValueOnce(new Error("Unauthorized"));
    // Deuxième appel → succès
    mockResolveLogin.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

    render(<LoginForm />);

    // Première soumission échoue
    await fillAndSubmit(
      user,
      VALID_CREDENTIALS.email,
      VALID_CREDENTIALS.password,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Email ou mot de passe incorrect."),
      ).toBeInTheDocument();
    });

    // Deuxième soumission réussit : l'alerte doit disparaître
    await user.click(screen.getByRole("button", { name: /connexion/i }));
    await waitFor(() => {
      expect(
        screen.queryByText("Email ou mot de passe incorrect."),
      ).not.toBeInTheDocument();
    });
  });

  // ── Visibilité du mot de passe ─────────────────────────────────────────────

  it("bascule la visibilité du mot de passe au clic sur l'icône", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText("••••••••");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: /afficher le mot de passe/i }),
    );
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", { name: /masquer le mot de passe/i }),
    );
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
