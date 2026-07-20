# Architecture du projet Learneo Frontend

> Document destiné aux développeurs. Décrit l'architecture globale, les conventions, le flux de développement et les règles d'organisation pour garantir la cohérence du code.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure des dossiers](#3-structure-des-dossiers)
4. [Architecture des modules](#4-architecture-des-modules)
5. [Routing (App Router)](#5-routing-app-router)
6. [Couche API](#6-couche-api)
7. [Gestion d'état](#7-gestion-détat)
8. [Authentification et permissions](#8-authentification-et-permissions)
9. [Formulaires et validation](#9-formulaires-et-validation)
10. [Composants UI et DataTable](#10-composants-ui-et-datatable)
11. [Types et normalisation](#11-types-et-normalisation)
12. [Tests](#12-tests)
13. [Flux de développement recommandé](#13-flux-de-développement-recommandé)
14. [Incohérences actuelles et plan de normalisation](#14-incohérences-actuelles-et-plan-de-normalisation)

---

## 1. Vue d'ensemble

Learneo Frontend est une application **multi-tenant** construite avec Next.js 16 (App Router). L'application sert deux types d'utilisateurs distincts :

- **Administrateurs plateforme** (`SUPER_ADMIN`, `EDITOR`) — accèdent à `/admin/**` pour gérer les tenants, cours, utilisateurs et contenus.
- **Utilisateurs tenant** (`CLIENT_MANAGER`, `TRAINEE`) — accèdent au portail tenant (`/dashboard`, `/formations`, etc.).

L'identification du tenant est réalisée via le sous-domaine (`tenant.learneo.app`) et injectée par le middleware Next.js dans chaque requête.

```
                         ┌─────────────────────────────────────┐
                         │          Next.js Middleware          │
                         │  Extrait tenant slug du sous-domaine │
                         │  Injecte X-Tenant-Slug header        │
                         │  Redirige si non authentifié         │
                         └───────────┬─────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
       ┌──────▼──────┐       ┌───────▼──────┐      ┌───────▼──────┐
       │  (admin)/   │       │   (portal)/  │      │    (auth)/   │
       │ /admin/**   │       │ /dashboard   │      │ /login       │
       │ AdminGuard  │       │ /formations  │      │ /register    │
       └─────────────┘       └──────────────┘      └──────────────┘
```

---

## 2. Stack technique

| Couche           | Technologie                      | Version     |
| ---------------- | -------------------------------- | ----------- |
| Framework        | Next.js (App Router, standalone) | 16.x        |
| UI               | React + React Compiler           | 19.x        |
| Typage           | TypeScript strict                | 5.x         |
| Style            | Tailwind CSS v4 + shadcn/ui      | 4.x         |
| Data fetching    | TanStack Query                   | v5          |
| État client      | Zustand                          | v5          |
| Formulaires      | react-hook-form + zod            | 7.x / 4.x   |
| HTTP             | Fetch natif (via `apiClient`)    | —           |
| Icônes           | lucide-react + @hugeicons/react  | —           |
| Notifications    | Sonner                           | —           |
| Rich text        | Tiptap                           | —           |
| Flow diagram     | @xyflow/react                    | —           |
| Drag & Drop      | @dnd-kit                         | —           |
| Linter/Formatter | Biome 2                          | 2.x         |
| Tests            | Jest 30 + Testing Library        | 30.x / 16.x |

---

## 3. Structure des dossiers

```
src/
├── app/                         ← Routing Next.js — NE PAS y mettre de logique métier
│   ├── layout.tsx               ← Root layout (Providers, font Inter)
│   ├── (admin)/                 ← Groupe route: zone administration
│   ├── (auth)/                  ← Groupe route: authentification tenant
│   └── (portal)/                ← Groupe route: portail tenant authentifié
│
├── components/ui/               ← Primitives shadcn (GÉNÉRÉS — ne pas modifier)
├── hooks/                       ← Hooks framework globaux (use-mobile uniquement)
├── lib/utils.ts                 ← cn() re-export pour shadcn
│
├── middleware.ts                ← Tenant resolution + auth redirect
│
├── modules/                     ← Code métier organisé en modules
│   ├── admin/                   ← Zone admin
│   ├── auth/                    ← Authentification
│   ├── portal/                  ← Zone portail
│   ├── quizzes/                 ← Module autonome (barrel export complet)
│   └── shared/                  ← Code partagé entre modules (niveau domaine)
│
└── shared/                      ← Infrastructure partagée (niveau application)
    ├── api/                     ← Services API partagés entre plusieurs modules
    ├── auth/                    ← Permissions et constantes de rôles
    ├── components/              ← Composants d'infrastructure (FormDrawer, DataTable…)
    ├── constants/               ← Constantes globales (routes, rôles)
    ├── hooks/                   ← Hooks d'infrastructure (usePermissions, useTenant)
    ├── lib/                     ← Utilitaires (apiClient, cn, date, Providers)
    ├── mocks/                   ← Fixtures de test partagées
    ├── queries/keys.ts          ← Query key factories TanStack Query
    ├── schemas/                 ← Schémas Zod partagés (auth)
    ├── stores/                  ← Stores Zustand
    ├── types/                   ← Types API bruts partagés
    └── utils/                   ← Utilitaires purs
```

### Règle fondamentale : deux niveaux de "shared"

| Dossier               | Niveau             | Contenu                                                                                                 |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| `src/shared/`         | **Infrastructure** | `apiClient`, stores Zustand, types API bruts, constantes globales, schémas auth                         |
| `src/modules/shared/` | **Domaine**        | Composants UI réutilisables entre modules (`UserSelector`, `CourseCard`…), hooks de contrôleur partagés |

Ne pas mélanger les deux. Si un composant contient de la logique métier, il appartient à `modules/shared/`. S'il appartient à l'infrastructure technique, il va dans `shared/`.

---

## 4. Architecture des modules

### Anatomie d'un module ressource

Chaque fonctionnalité est encapsulée dans un module ressource à la structure canonique suivante :

```
modules/{area}/resources/{resource}/
├── api/
│   └── index.ts          ← Objet API isolé pour cette ressource
├── hooks/
│   ├── use{Resource}Query.ts
│   ├── useCreate{Resource}.ts
│   └── useUpdate{Resource}.ts
├── pages/
│   ├── {Resource}List.tsx        ← Page principale
│   ├── {Resource}Detail.tsx      ← Page détail (si besoin)
│   └── _components/              ← Composants privés à la page
├── types/
│   └── index.ts          ← Types locaux + normalizeXxx()
└── index.ts              ← Barrel export (seule surface publique)
```

**Règle d'encapsulation** : rien ne sort d'un module sans passer par son `index.ts`. Les autres modules et les pages `app/` importent exclusivement depuis ce barrel.

### Exemple : module `admin/resources/users`

```
admin/resources/users/
├── api/index.ts          → adminUsersApi
├── hooks/
│   ├── useUsersQuery.ts  → useUsersQuery()
│   └── useCreateUser.ts  → useCreateUser()
├── pages/
│   ├── UsersList.tsx     → export default page
│   └── _components/
│       ├── users-table.tsx
│       └── user-form-drawer.tsx
├── types/index.ts        → ApiUser, User, normalizeUser()
└── index.ts              → export { UsersList }
```

---

## 5. Routing (App Router)

### Groupes de routes

| Groupe     | Path préfixe                  | Guard                             | Layout             |
| ---------- | ----------------------------- | --------------------------------- | ------------------ |
| `(admin)`  | `/admin/**`                   | `AdminAuthGuard` (PLATFORM_ROLES) | `AdminLayout`      |
| `(auth)`   | `/login`, `/forgot-password`… | Aucun                             | Centré plein écran |
| `(portal)` | `/dashboard`, `/formations`…  | `AuthGuard`                       | `LayoutSideBar`    |

### Convention pour les `page.tsx`

Les fichiers `page.tsx` sont de purs wrappers. Toute la logique est dans le module correspondant :

```tsx
// src/app/(portal)/formations/page.tsx
import { FormationsList } from '@modules/portal/resources/formations';
export default function Page() {
  return <FormationsList />;
}
```

### Ajouter une nouvelle route

1. Créer le dossier dans `src/app/(portal)/ma-route/` ou `src/app/(admin)/admin/(protected)/ma-route/`
2. Créer `page.tsx` qui importe le composant page du module
3. Créer le module dans `src/modules/{area}/resources/{resource}/`
4. Ajouter l'entrée de navigation dans `modules/{area}/config/navigation.tsx`

---

## 6. Couche API

### `apiClient.ts` — client HTTP central

Tous les appels HTTP passent par `src/shared/lib/apiClient.ts`. Ne jamais appeler `fetch` directement.

**Comportement automatique :**

- Préfixe `/api/v1/` sur toutes les URLs
- `credentials: 'include'` (cookie HttpOnly)
- Injection header `X-Tenant-ID` depuis `useTenantStore`
- Sur `401` : appel `clearAuth()` + redirection login

**Helpers exposés :**

```ts
apiGet<T>(url, options?)
apiPost<T, B>(url, body, options?)
apiPut<T, B>(url, body, options?)
apiPatch<T, B>(url, body, options?)
apiDelete(url, options?)
apiUpload<T>(url, formData, options?)
```

### Organisation des API

```
shared/api/              ← API partagées (plusieurs modules les utilisent)
│   auth.api.ts          → authApi (login, logout, reset-password)
│   courses.api.ts       → coursesApi, courseCategoriesApi, courseSectionsApi
│   content-entries.api.ts
│   content-type.api.ts
│   media.api.ts

modules/{area}/resources/{resource}/api/index.ts   ← API spécifique au module
```

### Exemple d'objet API

```ts
// modules/admin/resources/users/api/index.ts
import { apiGet, apiPost, apiPut, apiDelete } from '@shared/lib/apiClient';
import type { ApiUser, CreateUserPayload } from '../types';

export const adminUsersApi = {
  list: (params?: UsersParams) => apiGet<ApiUser[]>('/admin/users', { params }),
  getById: (id: string) => apiGet<ApiUser>(`/admin/users/${id}`),
  create: (payload: CreateUserPayload) =>
    apiPost<ApiUser, CreateUserPayload>('/admin/users', payload),
  update: (id: string, payload: Partial<CreateUserPayload>) =>
    apiPut<ApiUser, Partial<CreateUserPayload>>(`/admin/users/${id}`, payload),
  delete: (id: string) => apiDelete(`/admin/users/${id}`),
};
```

---

## 7. Gestion d'état

### TanStack Query — état serveur

Toutes les données provenant du backend sont gérées par TanStack Query.

**Configuration** (`src/shared/lib/query-client.ts`) :

- `staleTime: 60 000` ms
- `retry: 1`
- `refetchOnWindowFocus: false`

**Query keys** :

- Keys locales à un module : tableau de strings dans le hook (`['admin', 'users']`)
- Keys partagées entre modules : ajouter dans `src/shared/queries/keys.ts` via le pattern factory

```ts
// src/shared/queries/keys.ts
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params: CourseParams) => [...courseKeys.lists(), params] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
};
```

### Zustand — état client

Trois stores globaux dans `src/shared/stores/` :

| Store             | Persistance                 | Contenu                                        |
| ----------------- | --------------------------- | ---------------------------------------------- |
| `auth.store.ts`   | localStorage (`auth-store`) | `user: AuthUser \| null`, `role: Role \| null` |
| `tenant.store.ts` | Non                         | `tenant: Tenant \| null`, `resolutionStatus`   |
| `ui.store.ts`     | Non                         | `sidebarOpen: boolean`                         |

**Règles d'accès :**

```ts
// Dans un composant : sélecteur précis (évite les re-renders)
const user = useAuthStore((s) => s.user);

// Hors composant (apiClient, utils) :
const { tenantId } = useTenantStore.getState();
```

Ne jamais créer un nouveau store sans l'ajouter dans `src/shared/stores/`.

---

## 8. Authentification et permissions

### Flux d'authentification

L'application supporte deux flux d'authentification via la même interface :

| Flux       | Endpoint                           | Rôles                       |
| ---------- | ---------------------------------- | --------------------------- |
| Tenant     | `POST /api/v1/auth/login`          | `CLIENT_MANAGER`, `TRAINEE` |
| Plateforme | `POST /api/v1/platform/auth/login` | `SUPER_ADMIN`, `EDITOR`     |

**Sécurité** : le token JWT est exclusivement stocké en cookie HttpOnly par le backend. Il n'est jamais accessible depuis JavaScript.

### Guards disponibles

```
src/modules/auth/guards/
├── AuthGuard.tsx         ← Portail tenant (tout utilisateur authentifié)
├── AdminAuthGuard.tsx    ← Admin plateforme (PLATFORM_ROLES uniquement)
├── PlatformGuard.tsx     ← Alias AdminAuthGuard pour certains contextes
└── RoleGuard.tsx         ← Guard granulaire par rôle
```

Ne pas créer de nouvelle logique de guard. Utiliser les guards existants dans les layouts.

### Système de permissions

```ts
// src/shared/auth/permissions.ts
export const ACCESS = {
  manageUsers: { anyRoles: [SUPER_ADMIN, CLIENT_MANAGER] },
  viewReports: { superAdminOnly: true },
  // ...
};

// Dans un composant
const { canAccess } = usePermissions();
if (!canAccess(ACCESS.manageUsers)) return null;
```

### Rôles

```ts
// src/shared/constants/roles.ts
SUPER_ADMIN | EDITOR | CLIENT_MANAGER | TRAINEE;

PLATFORM_ROLES = [SUPER_ADMIN, EDITOR]; // Accès /admin
TENANT_ROLES = [CLIENT_MANAGER, TRAINEE]; // Accès portail
```

---

## 9. Formulaires et validation

### Pattern standard

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
});
type FormValues = z.infer<typeof schema>;

export function UserForm({ onSubmit }: { onSubmit: (data: FormValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}
    </form>
  );
}
```

### Form Drawer (pattern créer/éditer)

Pour les formulaires dans un drawer latéral, utiliser `useFormDrawer` :

```ts
// src/shared/components/form-drawer/use-form-drawer.ts
const drawer = useFormDrawer({
  open,
  entity, // null = création, objet = édition
  createMutation,
  updateMutation,
  schema,
  defaultValues: { name: '' },
  buildCreatePayload: (data) => ({ ...data }),
  buildUpdatePayload: (data) => ({ ...data }),
});
```

### Où placer les schémas Zod

| Schéma                       | Emplacement                                              |
| ---------------------------- | -------------------------------------------------------- |
| Auth (login, reset-password) | `src/shared/schemas/auth.schema.ts`                      |
| Module spécifique            | `src/modules/{area}/resources/{resource}/types/index.ts` |

---

## 10. Composants UI et DataTable

### shadcn/ui

Les composants de base (Button, Input, Dialog, etc.) sont générés par le CLI shadcn dans `src/components/ui/`. **Ne jamais modifier ces fichiers manuellement.**

```ts
// Import correct
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
```

### DataTable générique

Utiliser `DataTable` depuis `@shared/components/ui/DataTable/DataTable.tsx` pour toutes les listes tabulaires.

```tsx
import { DataTable, type DataTableColumn } from '@shared/components/ui/DataTable/DataTable';

const columns: DataTableColumn<User>[] = [
  {
    key: 'fullName',
    label: 'Nom',
    sortable: true,
    render: (row) => `${row.firstName} ${row.lastName}`,
    skeleton: <Skeleton className="h-4 w-40" />,
  },
  {
    key: 'email',
    label: 'Email',
    render: (row) => row.email,
    skeleton: <Skeleton className="h-4 w-52" />,
  },
];

<DataTable
  data={users}
  columns={columns}
  isLoading={isLoading}
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  onSort={handleSort}
  sort={sort}
/>;
```

**Fonctionnalités intégrées :**

- Lignes squelettes pendant le chargement (via prop `skeleton` par colonne)
- Tri côté serveur (prop `sort` + `onSort`)
- Pagination (tailles : 25 / 50 / 100)
- État vide personnalisable

### `cn()` — composition de classes

```ts
// Dans shadcn/composants UI
import { cn } from '@/lib/utils';

// Dans le code métier
import { cn } from '@shared/lib/cn';
```

### Règle de placement des composants

Avant de créer un composant, poser la question suivante :

> **"Ce composant dépend-il du contexte métier d'une fonctionnalité précise ?"**

| Réponse                                                | Emplacement                                                  | Raison                                |
| ------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------- |
| **Oui** — il manipule un type métier spécifique        | `src/modules/{area}/resources/{resource}/pages/_components/` | Encapsulation dans le module concerné |
| **Non, mais** il est réutilisé entre plusieurs modules | `src/modules/shared/components/{domain}/`                    | Partagé au niveau domaine             |
| **Non** — il est totalement indépendant du métier      | `src/shared/components/`                                     | Infrastructure réutilisable partout   |

**Règle détaillée :**

- Si le composant **dépend du contexte métier** (il sait qu'il affiche un utilisateur, un rapport, un produit…) → il reste dans son module. Même s'il est "bien fait", le déplacer serait prématuré.
- Si le composant est **indépendant du domaine** et pourrait être utilisé dans n'importe quel projet React → il appartient à `src/shared/components/`.

**Exemples concrets :**

| Composant                                                       | Contexte métier ? | Emplacement                                          |
| --------------------------------------------------------------- | ----------------- | ---------------------------------------------------- |
| `ReportStatusBadge` — badge coloré selon le statut d'un rapport | Oui               | `modules/admin/resources/reports/pages/_components/` |
| `UserRoleSelect` — dropdown limité aux rôles de l'application   | Oui               | `modules/admin/resources/users/pages/_components/`   |
| `ProductPricingCard` — carte affichant le prix d'un produit     | Oui               | `modules/portal/resources/store/pages/_components/`  |
| `UserAvatar` — avatar réutilisé dans portail ET admin           | Oui (domaine)     | `modules/shared/components/users/`                   |
| `CourseCard` — carte formation réutilisée dans plusieurs pages  | Oui (domaine)     | `modules/shared/components/courses/`                 |
| `ConfirmDialog` — modale de confirmation générique              | Non               | `src/shared/components/confirm-dialog/`              |
| `DataTable` — tableau paginé et triable générique               | Non               | `src/shared/components/ui/DataTable/`                |
| `SearchInput` — champ de recherche avec debounce                | Non               | `src/shared/components/ui/`                          |
| `FormDrawer` — drawer latéral pour formulaires                  | Non               | `src/shared/components/form-drawer/`                 |

**Illustration par arborescence :**

```
src/
├── shared/components/           ← Composants SANS connaissance métier
│   ├── confirm-dialog/
│   │   └── ConfirmDialog.tsx    → "Voulez-vous vraiment supprimer ?"
│   ├── form-drawer/
│   │   ├── FormDrawer.tsx       → Drawer générique pour formulaires
│   │   └── use-form-drawer.ts
│   └── ui/
│       ├── DataTable/
│       │   └── DataTable.tsx    → Tableau paginé et triable (aucune colonne prédéfinie)
│       └── SearchInput.tsx      → Input de recherche avec debounce
│
├── modules/shared/components/   ← Composants métier réutilisés entre modules
│   ├── users/
│   │   └── UserAvatar.tsx       → Sait qu'un utilisateur a firstName + avatar
│   └── courses/
│       └── CourseCard.tsx       → Sait qu'un cours a un titre, une image, un statut
│
└── modules/admin/resources/reports/pages/
    └── _components/             ← Composants PRIVÉS à cette page uniquement
        ├── reports-table.tsx    → Sait exactement quelles colonnes afficher pour Report
        └── report-status-badge.tsx → Badge coloré selon ReportStatus
```

> **Anti-pattern à éviter** : créer un composant générique dans `_components/` parce que c'est "plus rapide". Si un deuxième module en a besoin six mois plus tard, le déplacer coûte des imports cassés partout.

---

## 11. Types et normalisation

### Hiérarchie des types

```
Backend (snake_case)   →   ApiXxx (src/shared/types/)   →   Xxx (types/index.ts du module)
    ApiUser.first_name        ApiUser { first_name }         User { firstName }
```

### Convention de nommage

| Type                      | Préfixe                      | Emplacement                                          |
| ------------------------- | ---------------------------- | ---------------------------------------------------- |
| Type brut backend         | `Api*` (ex: `ApiUser`)       | `src/shared/types/{domain}.types.ts`                 |
| Type domaine normalisé    | Aucun (ex: `User`)           | `modules/{area}/resources/{resource}/types/index.ts` |
| Type de payload création  | `Create{Resource}Payload`    | idem                                                 |
| Type inféré de schéma Zod | Via `z.infer<typeof schema>` | co-localisé avec le schéma                           |

### Pattern de normalisation

```ts
// types/index.ts
export interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export function normalizeUser(api: ApiUser): User {
  return {
    id: api.id,
    firstName: api.first_name,
    lastName: api.last_name,
    email: api.email,
    role: api.role as Role,
    createdAt: new Date(api.created_at),
  };
}
```

---

## 12. Tests

### Organisation

Les tests sont co-localisés avec leur fichier source dans un sous-dossier `__tests__/` :

```
modules/admin/resources/users/
├── api/
│   ├── index.ts
│   └── __tests__/
│       └── users.api.test.ts
├── hooks/
│   ├── useUsersQuery.ts
│   └── __tests__/
│       └── useUsersQuery.test.ts
```

### Conventions

```ts
/**
 * @jest-environment node   ← pour les tests API/serveur uniquement
 */

// Mocker AVANT les imports pour éviter les problèmes de hoisting
jest.mock('@shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import { adminUsersApi } from '../index';

describe('adminUsersApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devrait lister les utilisateurs', async () => {
    const mockUsers = [{ id: '1', first_name: 'Alice' }];
    jest.mocked(apiGet).mockResolvedValue(mockUsers);

    const result = await adminUsersApi.list();
    expect(result).toEqual(mockUsers);
  });
});
```

**Règles :**

- Labels `describe`/`it` **en français**
- `jest.mocked()` pour les mocks typés
- `beforeEach(() => jest.clearAllMocks())`
- Fixtures = constantes nommées dans le fichier de test
- Mocks partagés entre tests → `src/shared/mocks/{domain}.mock.ts`

---

## 13. Flux de développement recommandé

### Ajouter une nouvelle ressource (ex: `AdminReports`)

```
1. Types
   └── src/modules/admin/resources/reports/types/index.ts
       ├── ApiReport (type brut backend)
       ├── Report    (type domaine normalisé)
       └── normalizeReport()

2. API
   └── src/modules/admin/resources/reports/api/index.ts
       └── adminReportsApi { list, getById, create, update, delete }

3. Query hooks
   └── src/modules/admin/resources/reports/hooks/
       ├── useReportsQuery.ts    (useQuery)
       └── useCreateReport.ts   (useMutation)

4. Composants page
   └── src/modules/admin/resources/reports/pages/
       ├── ReportsList.tsx       ('use client', compose controller + view)
       └── _components/
           └── reports-table.tsx

5. Barrel export
   └── src/modules/admin/resources/reports/index.ts
       export { ReportsList } from './pages/ReportsList';

6. Route Next.js
   └── src/app/(admin)/admin/(protected)/reports/page.tsx
       import { ReportsList } from '@modules/admin/resources/reports';
       export default function Page() { return <ReportsList />; }

7. Navigation
   └── src/modules/admin/config/navigation.tsx
       Ajouter l'entrée Reports dans ADMIN_NAV

8. Tests
   └── Co-localisés dans __tests__/ à chaque niveau
```

### Checklist avant de committer

- [ ] Aucun appel `fetch` direct (utiliser `apiGet`/`apiPost`/...)
- [ ] Types `Api*` dans `src/shared/types/` ou `types/index.ts` du module
- [ ] Fonction `normalizeXxx()` pour chaque type API
- [ ] `'use client'` présent sur tous les composants interactifs
- [ ] Alias de chemin utilisés (`@shared/`, `@modules/`, `@/`)
- [ ] Tout exporté via le barrel `index.ts` du module
- [ ] Tests co-localisés dans `__tests__/`
- [ ] Labels de tests en français

---

## 14. Incohérences actuelles et plan de normalisation

### État actuel des incohérences

| #   | Problème                                                                                                                                                 | Fichiers concernés                     | Priorité |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------- |
| 1   | **Mock data dans les hooks** : `useUsersQuery` retourne des données mock au lieu d'appeler `adminUsersApi.list()`                                        | `modules/admin/resources/users/hooks/` | Haute    |
| 2   | **Formations non connectées au backend** : `ClientFormationManagementApi.getAll()` retourne des mocks                                                    | `modules/portal/resources/formations/` | Haute    |
| 3   | **Stratégie query keys divisée** : certains modules utilisent des constantes locales (`ADMIN_USERS_QUERY_KEY`), d'autres le pattern factory de `keys.ts` | `shared/queries/keys.ts` vs. modules   | Moyenne  |
| 4   | **Double `cn()` utility** : `src/lib/utils.ts` (pour shadcn) ET `src/shared/lib/cn.ts` (métier)                                                          | Les deux sont identiques               | Faible   |
| 5   | **Casing de fichiers inconsistant** : hooks en camelCase (`useUsersQuery.ts`) vs. composants en kebab-case (`admin-users-table.tsx`)                     | Tous les modules                       | Faible   |
| 6   | **ESLint + Biome en parallèle** : les deux sont configurés, ce qui peut créer des conflits                                                               | `biome.json`, `eslint.config.mts`      | Faible   |

### Plan de normalisation cible

#### Court terme (incohérences bloquantes)

**1. Supprimer les mocks des hooks TanStack Query**

```ts
// Avant (à corriger)
export function useUsersQuery() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => Promise.resolve(MOCK_USERS), // ❌
  });
}

// Après
export function useUsersQuery(params?: UsersParams) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: () => adminUsersApi.list(params), // ✅
  });
}
```

#### Moyen terme (unification)

**3. Unifier la stratégie query keys**

Adopter le pattern factory de `src/shared/queries/keys.ts` pour toutes les query keys, y compris celles actuellement définies comme constantes locales dans les modules.

```ts
// src/shared/queries/keys.ts
export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (p: UsersParams) => [...adminUserKeys.lists(), p] as const,
  detail: (id: string) => [...adminUserKeys.all, 'detail', id] as const,
};
```

#### Long terme (nettoyage)

**5. Normaliser le casing des fichiers**

Adopter une règle unique : **tous les fichiers de composants et hooks en kebab-case**.

| Avant              | Après                                                    |
| ------------------ | -------------------------------------------------------- |
| `useUsersQuery.ts` | `use-users-query.ts`                                     |
| `useCreateUser.ts` | `use-create-user.ts`                                     |
| `UsersList.tsx`    | `users-list.tsx` (fichier) — composant reste `UsersList` |

**6. Abandonner ESLint en faveur de Biome uniquement**

Biome 2 couvre désormais la majorité des règles ESLint utiles. Supprimer `eslint.config.mts` et `eslint` des devDependencies pour simplifier la chaîne d'outils.

---

## Annexe : Conventions de nommage récapitulatives

| Élément            | Convention                 | Exemple                      |
| ------------------ | -------------------------- | ---------------------------- |
| Composant React    | PascalCase                 | `AdminUsersTable`            |
| Hook               | camelCase + préfixe `use`  | `useUsersQuery`              |
| Fichier composant  | kebab-case                 | `admin-users-table.tsx`      |
| Fichier hook       | camelCase                  | `useUsersQuery.ts`           |
| Fichier page       | PascalCase                 | `UsersList.tsx`              |
| Objet API          | camelCase + suffixe `Api`  | `adminUsersApi`              |
| Type brut backend  | PascalCase + préfixe `Api` | `ApiUser`, `ApiCourse`       |
| Type domaine       | PascalCase                 | `User`, `Course`             |
| Fonction normalize | `normalize{Resource}`      | `normalizeUser()`            |
| Constante          | SCREAMING_SNAKE_CASE       | `ADMIN_NAV`, `ROUTES`        |
| Store Zustand      | `use{Domain}Store`         | `useAuthStore`               |
| Dossier privé      | préfixe `_`                | `_components/`               |
| Chaînes UI         | Français                   | `"Enregistrer"`, `"Annuler"` |
