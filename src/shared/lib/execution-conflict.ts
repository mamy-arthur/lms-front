import { getApiErrorStatus } from './errors';

/**
 * Un conflit d'exécution : la visite ou la révision transmise ne correspond
 * plus à l'état serveur, ou l'inscription est devenue terminale.
 *
 * Les endpoints actuels utilisent `error_code`. `code` reste reconnu pour
 * tolérer les réponses d'anciennes versions du backend.
 */
export function isExecutionConflict(err: unknown): boolean {
  if (getApiErrorStatus(err) !== 409) return false;

  const json = (err as { json?: unknown } | null)?.json;
  if (!json || typeof json !== 'object') return false;

  const body = json as { code?: unknown; error_code?: unknown };

  return body.error_code === 'execution_conflict' || body.code === 'execution_conflict';
}

const EXECUTION_CONTEXT_FIELDS = ['node_execution_id', 'expected_state_revision'] as const;

/**
 * Refus du contexte d'exécution, toutes formes confondues : le 409 ci-dessus, ou
 * le 422 de validation quand la visite ou la révision manque / est invalide.
 *
 * Le 422 est le code de validation générique de l'API : seule la présence d'un
 * champ d'exécution dans `errors` le rattache au moteur. Sans ce filtre, une
 * erreur métier (« aucune question disponible », payload invalide) serait
 * présentée à l'apprenant comme un changement de parcours.
 */
export function isExecutionContextRejection(err: unknown): boolean {
  if (isExecutionConflict(err)) return true;
  if (getApiErrorStatus(err) !== 422) return false;

  const json = (err as { json?: unknown } | null)?.json;
  if (!json || typeof json !== 'object') return false;

  const errors = (json as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') return false;

  return EXECUTION_CONTEXT_FIELDS.some((field) => field in errors);
}

/**
 * Un 409/422 SCORM qui ne met pas en cause le contexte d'exécution : le compteur
 * `sequence` local a dérivé et doit être resynchronisé via
 * `GET .../scorm/tracking/sequence`.
 *
 * Cette récupération ne doit jamais être appliquée à un refus de contexte :
 * rejouer un commit en substituant la visite courante ferait fuiter la
 * progression d'un ancien passage dans le nouveau, et un rejeu à l'identique
 * échouerait de toute façon sans que l'apprenant en soit averti.
 */
export function isScormSequenceConflict(err: unknown): boolean {
  const status = getApiErrorStatus(err);

  return (status === 409 || status === 422) && !isExecutionContextRejection(err);
}
