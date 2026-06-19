import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { Role } from "@/shared/constants/roles";
import { MOCK_USERS } from "@modules/shared/components/users/mocks/users.mock";
import { normalizeTenantUser } from "../../types";
import type { TenantUser } from "../../types";

const MOCK_TENANT_USERS: TenantUser[] = MOCK_USERS.map((u) =>
  normalizeTenantUser(u),
);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/shared/hooks/useDebounce", () => ({
  useDebounce: <T,>(v: T) => v,
}));

jest.mock("@/shared/stores/tenant.store", () => ({
  useTenantStore: (selector: (s: { tenant: { id: string } }) => unknown) =>
    selector({ tenant: { id: "tenant-001" } }),
}));

function createMutationResult(overrides: Record<string, unknown> = {}) {
  return {
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
    ...overrides,
  };
}

jest.mock("../../hooks/useCreateTenantUser", () => ({
  useCreateTenantUser: jest.fn(),
}));

import { useCreateTenantUser } from "../../hooks/useCreateTenantUser";

const mockUseCreateTenantUser = jest.mocked(useCreateTenantUser);

jest.mock("../../hooks/useUpdateTenantUser", () => ({
  useUpdateTenantUser: jest.fn(),
}));

import { useUpdateTenantUser } from "../../hooks/useUpdateTenantUser";

const mockUseUpdateTenantUser = jest.mocked(useUpdateTenantUser);

jest.mock("../../hooks/useTenantUsersQuery", () => ({
  useTenantUsersQuery: jest.fn(),
  TENANT_USERS_QUERY_KEY: ["tenant", "users"],
}));

import { useTenantUsersQuery } from "../../hooks/useTenantUsersQuery";

const mockUseTenantUsersQuery = jest.mocked(useTenantUsersQuery);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderWithQuery(ui: ReactElement) {
  const qc = createQueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

import { UserFormDrawer } from "../../components/UserFormDrawer";
import { TenantUsersList } from "../../pages/TenantUsersList";

describe("normalizeTenantUser — fonction pure", () => {
  it("[nominal] mappe correctement un utilisateur complet", () => {
    const raw = {
      id: "abc-123",
      username: "jean.dupont",
      email: "jean@acme.io",
      role: "TRAINEE",
      is_active: true,
      created_at: "2025-03-01T10:00:00Z",
    };

    const user = normalizeTenantUser(raw);

    expect(user.id).toBe("abc-123");
    expect(user.first_name).toBe("");
    expect(user.last_name).toBe("");
    expect(user.username).toBe("jean.dupont");
    expect(user.email).toBe("jean@acme.io");
    expect(user.role).toBe(Role.TRAINEE);
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBe("2025-03-01T10:00:00Z");
  });

  it("[limite] extrait first_name et last_name quand présents", () => {
    const raw = {
      id: "x",
      first_name: "Marie",
      last_name: "Curie",
      email: "m@a.io",
    };
    const user = normalizeTenantUser(raw);
    expect(user.first_name).toBe("Marie");
    expect(user.last_name).toBe("Curie");
    expect(user.username).toBe("Marie.Curie");
  });

  it("[limite] retourne '—' quand tous les champs de nom sont absents", () => {
    const user = normalizeTenantUser({ id: "x", email: "x@x.io" });
    expect(user.first_name).toBe("");
    expect(user.last_name).toBe("");
    expect(user.username).toBe("—");
  });

  it("[limite] is_active vrai par défaut si champ absent", () => {
    const user = normalizeTenantUser({ id: "x" });
    expect(user.isActive).toBe(true);
  });
});

describe("TenantUsersList", () => {
  const MOCK_QUERY_RESULT = {
    data: { data: MOCK_TENANT_USERS, total: MOCK_TENANT_USERS.length },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTenantUsersQuery.mockReturnValue(MOCK_QUERY_RESULT as any);
    mockUseCreateTenantUser.mockReturnValue(createMutationResult() as any);
    mockUseUpdateTenantUser.mockReturnValue(createMutationResult() as any);
  });

  it("[nominal] affiche la première page de la liste paginée", () => {
    renderWithQuery(<TenantUsersList />);

    const rows = screen.getAllByTestId("user-row");
    expect(rows).toHaveLength(7);
  });

  it("[nominal] affiche le bouton 'Nouveau'", () => {
    renderWithQuery(<TenantUsersList />);
    expect(
      screen.getByRole("button", { name: /nouveau/i }),
    ).toBeInTheDocument();
  });

  it("[nominal] ouvre le drawer au clic sur 'Nouveau'", async () => {
    const user = userEvent.setup();
    renderWithQuery(<TenantUsersList />);

    await user.click(
      screen.getByRole("button", { name: /nouveau/i })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Créer un utilisateur")).toBeInTheDocument();
  });

  it("[nominal] la touche Entrée dans la recherche déclenche la mise à jour des params", async () => {
    const user = userEvent.setup();
    renderWithQuery(<TenantUsersList />);

    await user.type(
      screen.getByPlaceholderText(/rechercher par nom ou email/i),
      "alice{Enter}",
    );
    // useTenantUsersQuery est rappelé avec les nouveaux params
    expect(mockUseTenantUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "alice" }),
    );
  });

  it("[limite] affiche une table vide quand la liste est vide", () => {
    mockUseTenantUsersQuery.mockReturnValue({
      data: { data: [], total: 0 },
    } as any);
    renderWithQuery(<TenantUsersList />);

    expect(screen.queryAllByTestId("user-row")).toHaveLength(0);
  });
});

describe("UserFormDrawer — création", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();
  let createResult: ReturnType<typeof createMutationResult>;

  beforeEach(() => {
    jest.clearAllMocks();
    createResult = createMutationResult();
    mockUseCreateTenantUser.mockReturnValue(createResult as any);
    mockUseUpdateTenantUser.mockReturnValue(createMutationResult() as any);
  });

  it("[nominal] affiche tous les champs du formulaire", () => {
    renderWithQuery(
      <UserFormDrawer open onClose={onClose} onSuccess={onSuccess} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Prénom")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
  });

  it("[nominal] soumet le formulaire avec des données valides et appelle mutate", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UserFormDrawer open onClose={onClose} onSuccess={onSuccess} />,
    );

    await user.type(screen.getByLabelText("Prénom"), "Paul");
    await user.type(screen.getByLabelText("Nom"), "Test");
    await user.type(screen.getByLabelText("Email"), "paul@acme.io");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: /créer/i }));

    await waitFor(() => {
      expect(createResult.mutate).toHaveBeenCalledWith(
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
    renderWithQuery(<UserFormDrawer open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /créer/i }));

    await waitFor(() => {
      expect(screen.getByText("Prénom requis")).toBeInTheDocument();
      expect(screen.getByText("Nom requis")).toBeInTheDocument();
    });
    expect(createResult.mutate).not.toHaveBeenCalled();
  });

  it("[erreur] affiche l'erreur serveur retournée par l'API", () => {
    const apiError = Object.assign(new Error("Unprocessable Entity"), {
      json: { message: "L'email est déjà utilisé." },
    });
    createResult = createMutationResult({ isError: true, error: apiError });
    mockUseCreateTenantUser.mockReturnValue(createResult as any);

    renderWithQuery(<UserFormDrawer open onClose={onClose} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("L'email est déjà utilisé.")).toBeInTheDocument();
  });

  it("[erreur] affiche un message générique si l'erreur ne contient pas de json.message", () => {
    const apiError = new Error("Internal Server Error");
    createResult = createMutationResult({ isError: true, error: apiError });
    mockUseCreateTenantUser.mockReturnValue(createResult as any);

    renderWithQuery(<UserFormDrawer open onClose={onClose} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });

  it("[nominal] appelle onClose et réinitialise le formulaire au clic Annuler", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UserFormDrawer open onClose={onClose} />);

    await user.type(screen.getByLabelText("Prénom"), "Test");
    await user.click(screen.getByRole("button", { name: /annuler/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => {});
    expect(screen.queryByDisplayValue("Test")).not.toBeInTheDocument();
  });

  it("[limite] désactive le bouton Créer pendant la soumission (isPending)", () => {
    createResult = createMutationResult({ isPending: true });
    mockUseCreateTenantUser.mockReturnValue(createResult as any);

    renderWithQuery(<UserFormDrawer open onClose={onClose} />);

    expect(screen.getByRole("button", { name: /création/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /annuler/i })).toBeDisabled();
  });

  it("[limite] n'affiche pas le dialog si open=false", () => {
    renderWithQuery(<UserFormDrawer open={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("UserFormDrawer — édition", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();
  const mockUser = MOCK_TENANT_USERS[0];
  let updateResult: ReturnType<typeof createMutationResult>;

  beforeEach(() => {
    jest.clearAllMocks();
    updateResult = createMutationResult();
    mockUseCreateTenantUser.mockReturnValue(createMutationResult() as any);
    mockUseUpdateTenantUser.mockReturnValue(updateResult as any);
  });

  it("[nominal] affiche le titre et les champs pré-remplis en mode édition", () => {
    renderWithQuery(
      <UserFormDrawer
        open
        onClose={onClose}
        onSuccess={onSuccess}
        user={mockUser}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modifier l'utilisateur")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enregistrer/i }),
    ).toBeInTheDocument();
  });

  it("[nominal] soumet les modifications avec les données modifiées", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UserFormDrawer
        open
        onClose={onClose}
        onSuccess={onSuccess}
        user={mockUser}
      />,
    );

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "alice.new@acme.io");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() => {
      expect(updateResult.mutate).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          data: {
            first_name: "Alice",
            last_name: "Martin",
            username: "alice.martin",
            email: "alice.new@acme.io",
            role: mockUser.role,
            city: "Paris",
            country: "France",
          },
        },
        expect.any(Object),
      );
    });
  });

  it("[nominal] envoie le mot de passe uniquement s'il est renseigné", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UserFormDrawer
        open
        onClose={onClose}
        onSuccess={onSuccess}
        user={mockUser}
      />,
    );

    await user.type(screen.getByLabelText("Mot de passe"), "newpass123");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() => {
      expect(updateResult.mutate).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          data: expect.objectContaining({
            password: "newpass123",
          }),
        },
        expect.any(Object),
      );
    });
  });

  it("[limite] n'envoie pas le mot de passe s'il est vide", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <UserFormDrawer
        open
        onClose={onClose}
        onSuccess={onSuccess}
        user={mockUser}
      />,
    );

    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() => {
      const callArg = updateResult.mutate.mock.calls[0][0];
      expect(callArg.data.password).toBeUndefined();
    });
  });

  it("[erreur] affiche l'erreur serveur en mode édition", () => {
    const apiError = Object.assign(new Error("Conflict"), {
      json: { message: "Email déjà pris." },
    });
    updateResult = createMutationResult({ isError: true, error: apiError });
    mockUseUpdateTenantUser.mockReturnValue(updateResult as any);

    renderWithQuery(<UserFormDrawer open onClose={onClose} user={mockUser} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Email déjà pris.")).toBeInTheDocument();
  });
});
