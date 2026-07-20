# Copilot Instructions — Learneo Frontend

Ce fichier définit les règles que GitHub Copilot doit suivre pour générer du code cohérent avec l'architecture du projet.

---

## Stack technologique

- **Framework** : Next.js 16 (App Router, `output: standalone`)
- **React** : 19 avec React Compiler activé (`use client` obligatoire pour les composants interactifs)
- **TypeScript** : strict mode
- **Style** : Tailwind CSS v4 + shadcn/ui (primitives Radix UI)
- **Formulaires** : `react-hook-form` + `zod` (via `@hookform/resolvers/zod`)
- **Data fetching** : TanStack Query v5 (`@tanstack/react-query`)
- **État client** : Zustand v5
- **Linter/Formatter** : Biome 2 (indentation 2 espaces)
- **Tests** : Jest 30 + Testing Library React 16

---

## Aliases de chemins (tsconfig)

```ts
@/*        → src/*
@modules/* → src/modules/*
@shared/*  → src/shared/*
```

Utiliser systématiquement ces alias. Ne jamais utiliser de chemins relatifs remontant au-delà du module courant (`../../..`).

---

## Organisation des dossiers

### Arborescence principale

```
src/
├── app/                  ← Routing Next.js (App Router uniquement)
├── components/ui/        ← Composants shadcn générés (NE PAS modifier manuellement)
├── hooks/                ← Hooks utilitaires globaux (use-mobile.ts)
├── lib/                  ← utils.ts pour shadcn (cn re-export uniquement)
├── middleware.ts          ← Injection tenant slug + redirections auth
├── modules/              ← Modules fonctionnels métier
│   ├── admin/            ← Zone administration plateforme
│   ├── auth/             ← Formulaires et guards d'authentification
│   ├── portal/           ← Zone portail tenant
│   ├── quizzes/          ← Module standalone avec barrel export
│   └── shared/           ← Composants et hooks partagés entre modules (domaine)
└── shared/               ← Infrastructure partagée globale (API, stores, types, schemas)
```

### Structure interne d'un module ressource

Chaque ressource dans `modules/{area}/resources/{resource}/` suit cette structure **obligatoire** :

```
{resource}/
├── api/
│   └── index.ts          ← Objet API (ex: adminUsersApi) utilisant les helpers apiGet/apiPost/...
├── hooks/
│   ├── use{Resource}Query.ts   ← useQuery wrapper
│   ├── useCreate{Resource}.ts  ← useMutation + invalidation cache
│   └── useUpdate{Resource}.ts  ← useMutation + invalidation cache
├── pages/
│   ├── {Resource}List.tsx      ← Composant page principal ('use client')
│   └── _components/            ← Composants locaux à la page (non exportés)
├── types/
│   └── index.ts          ← Types locaux + fonction normalize{Resource}()
└── index.ts              ← Barrel export (seul point d'entrée public du module)
```

---

## Où créer les fichiers

| Type de fichier | Emplacement |
|---|---|
| Composant UI générique (shadcn) | `src/components/ui/` — généré via CLI shadcn |
| Composant partagé cross-domaine | `src/modules/shared/components/{domain}/` |
| Composant partagé infrastructure | `src/shared/components/` |
| Composant local à une page | `src/modules/{area}/resources/{resource}/pages/_components/` |
| Hook métier partagé | `src/modules/shared/hooks/` |
| Hook infrastructure partagé | `src/shared/hooks/` |
| Service API d'un module | `src/modules/{area}/resources/{resource}/api/index.ts` |
| Service API partagé (multi-modules) | `src/shared/api/{domain}.api.ts` |
| Type API brut (backend) | `src/shared/types/{domain}.types.ts` |
| Type local à un module | `src/modules/{area}/resources/{resource}/types/index.ts` |
| Schéma Zod d'auth | `src/shared/schemas/auth.schema.ts` |
| Schéma Zod d'un module | Co-localisé dans le module (ex: `types/index.ts`) |
| Store Zustand | `src/shared/stores/{domain}.store.ts` |
| Query keys partagées | `src/shared/queries/keys.ts` |
| Constantes globales | `src/shared/constants/` |
| Tests | `__tests__/` co-localisé avec le fichier testé |
| Mocks de test | `src/shared/mocks/{domain}.mock.ts` |

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase | `AdminUsersTable`, `UserFormDrawer` |
| Hooks | camelCase préfixé `use` | `useUsersQuery`, `useCreateUser`, `useFormDrawer` |
| Fichiers hooks | camelCase | `useUsersQuery.ts`, `useCreateUser.ts` |
| Fichiers composants | kebab-case | `admin-users-table.tsx`, `user-form-drawer.tsx` |
| Fichiers pages | PascalCase | `UsersList.tsx` |
| Objets API | camelCase suffixé `Api` | `adminUsersApi`, `coursesApi` |
| Types API bruts | PascalCase préfixé `Api` | `ApiCourse`, `ApiCourseSection`, `ApiUser` |
| Types domaine | PascalCase | `Course`, `User`, `Module` |
| Fonctions normalize | camelCase `normalize{Resource}` | `normalizeUser()`, `normalizeModule()` |
| Constantes | SCREAMING_SNAKE_CASE | `ADMIN_NAV`, `PLATFORM_ROLES`, `ROUTES` |
| Stores Zustand | camelCase suffixé `Store` | `useAuthStore`, `useTenantStore` |
| Dossiers composants locaux | préfixé `_` | `_components/` |
| Barrel exports | `index.ts` à la racine du module | `modules/quizzes/index.ts` |

---

## Règles de composants React

### `use client` obligatoire pour
- Tout composant utilisant `useState`, `useEffect`, `useRef`, `useContext`
- Tout composant utilisant des hooks TanStack Query ou Zustand
- Tout composant avec des event handlers (`onClick`, `onChange`, etc.)
- Les layouts avec guards d'authentification

### Server Components par défaut pour
- Les layouts sans interactivité
- Les pages qui délèguent le rendu à un composant client enfant

### Pattern de page standard
```tsx
// src/modules/{area}/resources/{resource}/pages/ResourceList.tsx
'use client';

export function ResourceList() {
  const controller = useResourceListController();
  return <ResourceListView {...controller} />;
}
```

---

## Règles API

### Créer un objet API de module
```ts
// src/modules/{area}/resources/{resource}/api/index.ts
import { apiGet, apiPost, apiPut, apiDelete } from '@shared/lib/apiClient';
import type { ApiResource, CreateResourcePayload } from '../types';

export const adminResourceApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<ApiResource[]>('/admin/resources', { params }),
  getById: (id: string) =>
    apiGet<ApiResource>(`/admin/resources/${id}`),
  create: (payload: CreateResourcePayload) =>
    apiPost<ApiResource, CreateResourcePayload>('/admin/resources', payload),
  update: (id: string, payload: Partial<CreateResourcePayload>) =>
    apiPut<ApiResource, Partial<CreateResourcePayload>>(`/admin/resources/${id}`, payload),
  delete: (id: string) =>
    apiDelete(`/admin/resources/${id}`),
};
```

Ne jamais appeler `fetch` directement. Toujours utiliser les helpers `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `apiUpload` depuis `@shared/lib/apiClient`.

---

## Règles TanStack Query

### Hook de liste
```ts
// use{Resource}Query.ts
import { useQuery } from '@tanstack/react-query';
import { adminResourceApi } from '../api';

export const RESOURCE_QUERY_KEY = ['admin', 'resources'] as const;

export function useResourceQuery(params?: ResourceParams) {
  return useQuery({
    queryKey: [...RESOURCE_QUERY_KEY, params],
    queryFn: () => adminResourceApi.list(params),
  });
}
```

### Hook de mutation
```ts
// useCreate{Resource}.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RESOURCE_QUERY_KEY } from './useResourceQuery';

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminResourceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_QUERY_KEY });
    },
  });
}
```

- Préférer `invalidateQueries` pour les listes; `setQueryData` pour les mises à jour individuelles.
- Les query keys locales à un module sont des tableaux de strings (`['admin', 'users']`).
- Les query keys partagées doivent être ajoutées dans `src/shared/queries/keys.ts` via le pattern factory.

---

## Règles Formulaires

### Pattern standard react-hook-form + zod
```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
});
type FormValues = z.infer<typeof schema>;

export function ResourceForm({ onSubmit }: { onSubmit: (data: FormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
}
```

### Form Drawer
Pour les formulaires de création/édition dans un drawer latéral, utiliser le hook `useFormDrawer` depuis `@shared/components/form-drawer/use-form-drawer`.

---

## Règles Zustand

- Ne **jamais** créer un nouveau store sans l'ajouter dans `src/shared/stores/`.
- Utiliser le pattern `persist` (localStorage) uniquement pour les données nécessaires entre sessions (`auth-store`).
- Accès hors composant : `useXxxStore.getState()` (ex : dans `apiClient.ts`).
- Accès dans composants : sélecteurs `useXxxStore((s) => s.field)` pour éviter les re-renders inutiles.

---

## Règles de types

- Les types bruts du backend (snake_case, optionnels) sont préfixés `Api*` et placés dans `src/shared/types/`.
- Chaque module expose ses types domaine (camelCase, normalisés) dans son `types/index.ts`.
- Toujours créer une fonction `normalize{Resource}(api: ApiResource): Resource` dans `types/index.ts`.
- Utiliser `z.infer<typeof schema>` pour dériver les types de formulaire depuis les schémas Zod.

---

## Règles de tests

### Fichier de test standard
```ts
// __tests__/myFunction.test.ts
import { myFunction } from '../myFunction';

// Mocker les dépendances AVANT les imports si nécessaire
jest.mock('@shared/lib/apiClient', () => ({
  apiPost: jest.fn(),
}));

describe('myFunction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devrait retourner le résultat attendu', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

- Les fichiers de test sont dans `__tests__/` co-localisés avec le fichier source.
- Les labels `describe`/`it` sont **en français**.
- Utiliser `jest.mocked(fn)` pour l'accès typé aux mocks.
- Utiliser `@jest-environment node` (docblock) pour les tests serveur/API.
- Les fixtures sont des constantes nommées dans le fichier de test.

---

## Règles d'authentification et de guards

- Ne pas créer de nouvelle logique de guard — utiliser `AuthGuard`, `AdminAuthGuard`, `RoleGuard` depuis `src/modules/auth/guards/`.
- Les layouts protégés wrappent leurs enfants dans le guard approprié.
- Vérification des permissions : utiliser `usePermissions()` depuis `src/shared/hooks/usePermissions.ts`.
- Ne jamais stocker le token JWT dans le state ou localStorage — il est géré exclusivement en cookie HttpOnly par le backend.

---

## Règles de routing

- Créer les routes exclusivement sous `src/app/`.
- Les nouvelles routes du portail tenant vont dans `src/app/(portal)/`.
- Les nouvelles routes admin vont dans `src/app/(admin)/admin/(protected)/`.
- Les `page.tsx` doivent être de simples wrappers qui importent et rendent la page du module correspondant :
  ```tsx
  // src/app/(portal)/ma-nouvelle-route/page.tsx
  import { MaNouvellePage } from '@modules/portal/resources/ma-ressource';
  export default function Page() { return <MaNouvellePage />; }
  ```

---

## Règles DataTable

Utiliser le composant générique `DataTable` depuis `@shared/components/ui/DataTable/DataTable.tsx`.

```tsx
const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    label: 'Nom',
    sortable: true,
    render: (row) => row.name,
    skeleton: <Skeleton className="h-4 w-32" />,
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
/>
```

---

## Règles UI / Style

- Utiliser les composants shadcn depuis `@/components/ui/` (chemin absolu avec alias `@/`).
- Ne jamais écrire de CSS inline ou de styles Tailwind ad-hoc pour des patterns déjà couverts par shadcn.
- Utiliser `cn()` depuis `@/lib/utils` (pour shadcn) ou `@shared/lib/cn` dans le code métier.
- Toutes les chaînes de caractères visibles par l'utilisateur sont **en français**.
- Icônes : `lucide-react` pour les icônes UI génériques, `@hugeicons/react` pour les icônes personnalisées.
- Toasts : `sonner` via le composant `Toaster` depuis `@/components/ui/sonner`.

---

## Ce qu'il ne faut PAS faire

- ❌ Ne pas créer de composants dans `src/components/ui/` manuellement (réservé à shadcn CLI).
- ❌ Ne pas créer de hooks dans `src/hooks/` (réservé aux hooks globaux de framework comme `use-mobile`).
- ❌ Ne pas dupliquer `cn()` — utiliser les imports existants.
- ❌ Ne pas créer de fichiers `utils.ts` ad-hoc dans les modules — les utilitaires partagés vont dans `src/shared/utils/` ou `src/modules/shared/lib/`.
- ❌ Ne pas exposer les détails internes d'un module — tout passe par le `index.ts` barrel.
- ❌ Ne pas appeler `fetch` directement — utiliser les helpers `apiClient`.
- ❌ Ne pas utiliser `localStorage` pour l'auth — cookie HttpOnly uniquement.
- ❌ Ne pas créer de types dupliqués — vérifier d'abord dans `src/shared/types/`.
