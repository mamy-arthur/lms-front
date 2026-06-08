import { Role } from "@/shared/constants/roles";
import type { TenantUser } from "../types";

/**
 * Données de démonstration — remplacées dès que l'endpoint GET /users est disponible.
 * Fichier supprimé lors de l'implémentation de l'API de listing.
 */
export const MOCK_TENANT_USERS: TenantUser[] = [
  {
    id: "u-mock-001",
    name: "Alice Martin",
    email: "alice.martin@acme.io",
    role: Role.CLIENT_MANAGER,
    isActive: true,
    createdAt: "2025-01-15T09:00:00Z",
  },
  {
    id: "u-mock-002",
    name: "Bob Dupont",
    email: "bob.dupont@acme.io",
    role: Role.TRAINEE,
    isActive: true,
    createdAt: "2025-02-03T14:30:00Z",
  },
  {
    id: "u-mock-003",
    name: "Clara Lefebvre",
    email: "clara.lefebvre@acme.io",
    role: Role.TRAINEE,
    isActive: false,
    createdAt: "2025-03-12T11:00:00Z",
  },
  {
    id: "u-mock-004",
    name: "David Morel",
    email: "david.morel@acme.io",
    role: Role.TRAINEE,
    isActive: true,
    createdAt: "2025-04-20T08:45:00Z",
  },
  {
    id: "u-mock-005",
    name: "Eva Bernard",
    email: "eva.bernard@acme.io",
    role: Role.CLIENT_MANAGER,
    isActive: true,
    createdAt: "2025-05-07T16:00:00Z",
  },
];
