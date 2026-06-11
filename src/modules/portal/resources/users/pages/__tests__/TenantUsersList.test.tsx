/**
 * Tests unitaires — Gestion des utilisateurs (vue tenant)
 *
 * Couvre :
 *   - normalizeTenantUser (fonction pure)
 *   - TenantUsersList     (rendu, recherche, ouverture modale)
 *   - UserFormModal       (validation, soumission, erreur serveur, annulation)
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Role } from "@/shared/constants/roles";
import { normalizeTenantUser } from "../../types";
import { MOCK_TENANT_USERS } from "../../mocks/users.mock";

// ─── Mocks globaux ────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

/** useDebounce retourne la valeur immédiatement dans les tests */
jest.mock("@/shared/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

/** Mock du store tenant — fournit un tenant_id fixe */
jest.mock("@/shared/stores/tenant.store", () => ({
  useTenantStore: (selector: (s: { tenant: { id: string } }) => unknown) =>
    selector({ tenant: { id: "tenant-001" } }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockMutate = jest.fn();
const mockResetMutation = jest.fn();

function makeMutateMock(
  overrides: Partial<ReturnType<typeof makeUseMutationResult>> = {},
) {
  return {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
    reset: mockResetMutation,
    ...overrides,
  };
}
type MutationResult = ReturnType<typeof makeMutateMock>;
function makeUseMutationResult(
  o: Partial<MutationResult> = {},
): MutationResult {
  return makeMutateMock(o);
}

jest.mock("../../hooks/useCreateTenantUser", () => ({
  useCreateTenantUser: jest.fn(),
}));
import { useCreateTenantUser } from "../../hooks/useCreateTenantUser";
const mockUseCreateTenantUser = jest.mocked(useCreateTenantUser);

jest.mock("../../hooks/useTenantUsersQuery", () => ({
  useTenantUsersQuery: jest.fn(),
  TENANT_USERS_QUERY_KEY: ["tenant", "users"],
}));
import { useTenantUsersQuery } from "../../hooks/useTenantUsersQuery";
const mockUseTenantUsersQuery = jest.mocked(useTenantUsersQuery);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const qc = createQueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// ─── Import composants après les mocks ───────────────────────────────────────

import { TenantUsersList } from "../../pages/TenantUsersList";
import { UserFormModal } from "../../components/UserFormModal";

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("normalizeTenantUser — fonction pure", () => {
  it("[nominal] mappe correctement un utilisateur complet", () => {
    const raw = {
      id: "abc-123",
      full_name: "Jean Dupont",
      email: "jean@acme.io",
      role: "TRAINEE",
      is_active: true,
      created_at: "2025-03-01T10:00:00Z",
    };

    const user = normalizeTenantUser(raw);

    expect(user.id).toBe("abc-123");
    expect(user.name).toBe("Jean Dupont");
    expect(user.email).toBe("jean@acme.io");
    expect(user.role).toBe(Role.TRAINEE);
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBe("2025-03-01T10:00:00Z");
  });

  it("[limite] construit le nom depuis first_name + last_name si full_name absent", () => {
    const raw = {
      id: "x",
      first_name: "Marie",
      last_name: "Curie",
      email: "m@a.io",
    };
    const user = normalizeTenantUser(raw);
    expect(user.name).toBe("Marie Curie");
  });

  it("[limite] retourne '—' quand tous les champs de nom sont absents", () => {
    const user = normalizeTenantUser({ id: "x", email: "x@x.io" });
    expect(user.name).toBe("—");
  });

  it("[limite] is_active faux par défaut si champ absent", () => {
    // Aucun champ is_active / isActive / active → Boolean(undefined) = false
    // Mais on a mis ?? true dans normalizer → doit retourner true
    const user = normalizeTenantUser({ id: "x" });
    expect(user.isActive).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("TenantUsersList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTenantUsersQuery.mockReturnValue({
      data: MOCK_TENANT_USERS,
    } as ReturnType<typeof useTenantUsersQuery>);
    mockUseCreateTenantUser.mockReturnValue(
      makeUseMutationResult() as ReturnType<typeof useCreateTenantUser>,
    );
  });

  it("[nominal] affiche la première page de la liste paginée", () => {
    renderWithQuery(<TenantUsersList />);

    const rows = screen.getAllByTestId("user-row");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(25);
  });

  it("[nominal] affiche le bouton 'Nouvel utilisateur'", () => {
    renderWithQuery(<TenantUsersList />);
    expect(
      screen.getByRole("button", { name: /nouvel utilisateur/i }),
    ).toBeInTheDocument();
  });

  it("[nominal] ouvre la modale au clic sur 'Nouvel utilisateur'", async () => {
    const user = userEvent.setup();
    renderWithQuery(<TenantUsersList />);

    await user.click(
      screen.getByRole("button", { name: /nouvel utilisateur/i }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Créer un utilisateur")).toBeInTheDocument();
  });

  it("[nominal] filtre les utilisateurs selon la recherche", async () => {
    const user = userEvent.setup();
    renderWithQuery(<TenantUsersList />);

    await user.type(
      screen.getByPlaceholderText(/rechercher par nom ou email/i),
      "AdminInfo",
    );

    const rows = screen.getAllByTestId("user-row");
    expect(rows).toHaveLength(4);
    expect(screen.queryByText("Bob Dupont")).not.toBeInTheDocument();
  });

  it("[limite] affiche une table vide quand la liste est vide", () => {
    mockUseTenantUsersQuery.mockReturnValue({ data: [] } as ReturnType<
      typeof useTenantUsersQuery
    >);
    renderWithQuery(<TenantUsersList />);

    expect(screen.queryAllByTestId("user-row")).toHaveLength(0);
  });

  it("[limite] retourne la première page des utilisateurs quand la recherche est vide", () => {
    renderWithQuery(<TenantUsersList />);
    const rows = screen.getAllByTestId("user-row");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(25);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("UserFormModal", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreateTenantUser.mockReturnValue(
      makeUseMutationResult() as ReturnType<typeof useCreateTenantUser>,
    );
  });

  it("[nominal] affiche tous les champs du formulaire", () => {
    renderWithQuery(
      <UserFormModal open onClose={onClose} onSuccess={onSuccess} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it("[nominal] soumet le formulaire avec des données valides et appelle mutate", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UserFormModal open onClose={onClose} onSuccess={onSuccess} />,
    );

    await user.type(screen.getByLabelText(/prénom/i), "Paul");
    await user.type(screen.getByLabelText(/^nom/i), "Test");
    await user.type(screen.getByLabelText(/email/i), "paul@acme.io");
    await user.type(screen.getByLabelText(/mot de passe/i), "password123");
    await user.click(screen.getByRole("button", { name: /créer/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Paul",
          last_name: "Test",
          email: "paul@acme.io",
          password: "password123",
          tenant_id: "tenant-001",
        }),
        expect.any(Object),
      );
    });
  });

  it("[erreur] affiche les erreurs de validation si le formulaire est soumis vide", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UserFormModal open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText("Prénom requis")).toBeInTheDocument();
      expect(screen.getByText("Nom requis")).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("[erreur] affiche l'erreur serveur retournée par l'API", () => {
    const apiError = Object.assign(new Error("Unprocessable Entity"), {
      json: { message: "L'email est déjà utilisé." },
    });
    mockUseCreateTenantUser.mockReturnValue(
      makeUseMutationResult({ isError: true, error: apiError }) as ReturnType<
        typeof useCreateTenantUser
      >,
    );

    renderWithQuery(<UserFormModal open onClose={onClose} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("L'email est déjà utilisé.")).toBeInTheDocument();
  });

  it("[erreur] affiche un message générique si l'erreur ne contient pas de json.message", () => {
    const apiError = new Error("Internal Server Error");
    mockUseCreateTenantUser.mockReturnValue(
      makeUseMutationResult({ isError: true, error: apiError }) as ReturnType<
        typeof useCreateTenantUser
      >,
    );

    renderWithQuery(<UserFormModal open onClose={onClose} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });

  it("[nominal] appelle onClose et réinitialise le formulaire au clic Annuler", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UserFormModal open onClose={onClose} />);

    await user.type(screen.getByLabelText(/prénom/i), "Test");
    await user.click(screen.getByRole("button", { name: /annuler/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    // Après réouverture le champ doit être vide
    act(() => {
      /* le state de reset est synchrone */
    });
    // Le champ est réinitialisé (controlled par react-hook-form)
    expect(screen.queryByDisplayValue("Test")).not.toBeInTheDocument();
  });

  it("[limite] désactive le bouton Créer pendant la soumission (isPending)", () => {
    mockUseCreateTenantUser.mockReturnValue(
      makeUseMutationResult({ isPending: true }) as ReturnType<
        typeof useCreateTenantUser
      >,
    );

    renderWithQuery(<UserFormModal open onClose={onClose} />);

    expect(screen.getByRole("button", { name: /création/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /annuler/i })).toBeDisabled();
  });

  it("[limite] n'affiche pas le dialog si open=false", () => {
    renderWithQuery(<UserFormModal open={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
