import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/lib/apiClient';

export interface TemplateVariable {
  key: string; // Placeholder complet, ex: "{{user.fullName}}"
  label: string; // Libellé affiché dans le sélecteur
  category: string; // "user" | "course" | "tenant" | "certificate"
  template_type: string; // "mail" | "attestation" | "both"
}

/** Réponse de l'API : variables regroupées par catégorie. */
export type GroupedTemplateVariables = Record<string, TemplateVariable[]>;

interface ApiResponse {
  data: GroupedTemplateVariables;
}

/**
 * Charge les variables de template depuis le backend.
 *
 * @param apiPath   Chemin relatif : `'platform/template-variables'` (admin)
 *                  ou `'template-variables'` (portail tenant).
 * @param type      `'attestation'` | `'mail'` — filtre les variables compatibles.
 */
export function useTemplateVariablesQuery(apiPath: string, type: 'attestation' | 'mail') {
  return useQuery({
    queryKey: ['template-variables', apiPath, type],
    queryFn: () => apiGet<ApiResponse>(`${apiPath}?template_type=${type}`),
    staleTime: 5 * 60 * 1000, // 5 min — catalogue rarement modifié
  });
}
