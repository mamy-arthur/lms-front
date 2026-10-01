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
 * Valeur à donner au `SelectItem` d'une variable.
 *
 * Un même placeholder peut être déclaré par plusieurs resolvers dans des
 * catégories différentes — `{{expires_in}}` existe en `otp` (validité du code)
 * et en `password_reset` (validité du lien). Or Radix rend un `<select>` natif
 * caché où **tous** les `<option>` sont frères et keyés sur `value` : deux
 * items partageant la même `value`, fussent-ils dans des `SelectGroup`
 * distincts, déclenchent un warning de clé dupliquée et rendent la sélection
 * ambiguë. Préfixer par la catégorie rend la valeur unique sans masquer
 * l'entrée dans l'une des deux catégories.
 */
export function variableItemValue(category: string, key: string) {
  return `${category}::${key}`;
}

/** Inverse de {@link variableItemValue} : retrouve le placeholder à insérer. */
export function variableKeyFromItemValue(value: string) {
  const separator = value.indexOf('::');
  return separator === -1 ? value : value.slice(separator + 2);
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
