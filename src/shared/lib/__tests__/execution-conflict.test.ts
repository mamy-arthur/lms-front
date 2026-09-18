import {
  isExecutionConflict,
  isExecutionContextRejection,
  isScormSequenceConflict,
} from '../execution-conflict';

function httpError(status: number, json: unknown): Error {
  return Object.assign(new Error('Conflict'), { status, json });
}

describe('Détection des conflits d’exécution', () => {
  it('reconnaît les deux emplacements du code selon l’endpoint', () => {
    // Rendu central (start, complétion, tentatives).
    expect(isExecutionConflict(httpError(409, { error_code: 'execution_conflict' }))).toBe(true);
    // Réponses locales des contrôleurs temps et SCORM.
    expect(isExecutionConflict(httpError(409, { code: 'execution_conflict' }))).toBe(true);
  });

  it('ignore un 409 qui ne porte pas ce code', () => {
    expect(isExecutionConflict(httpError(409, { message: 'Plafond atteint.' }))).toBe(false);
    expect(isExecutionConflict(httpError(409, { code: 'time_session_context_conflict' }))).toBe(
      false,
    );
  });

  it('n’assimile pas un autre statut à un conflit d’exécution', () => {
    expect(isExecutionConflict(httpError(422, { error_code: 'execution_conflict' }))).toBe(false);
    expect(isExecutionConflict(null)).toBe(false);
  });

  it('rattache au moteur le 422 portant sur un champ d’exécution', () => {
    expect(
      isExecutionContextRejection(
        httpError(422, { errors: { expected_state_revision: ['requis'] } }),
      ),
    ).toBe(true);
    expect(
      isExecutionContextRejection(httpError(422, { errors: { node_execution_id: ['invalide'] } })),
    ).toBe(true);
  });

  it('laisse l’appelant afficher le message réel d’un 422 métier', () => {
    // Sans ce filtre, « aucune question disponible » serait présenté à
    // l’apprenant comme un changement de parcours.
    expect(
      isExecutionContextRejection(httpError(422, { errors: { ended_at: ['trop tard'] } })),
    ).toBe(false);
    expect(isExecutionContextRejection(httpError(422, { message: 'Aucune question.' }))).toBe(
      false,
    );
  });

  it('sépare la dérive de séquence SCORM du conflit d’exécution', () => {
    // Séquence hors-ordre : resynchronisation légitime.
    expect(isScormSequenceConflict(httpError(409, { message: 'Séquence obsolète.' }))).toBe(true);
    expect(isScormSequenceConflict(httpError(422, { message: 'Saut trop grand.' }))).toBe(true);
    // Conflit d'exécution : rejouer le commit ferait fuiter l'ancien passage.
    expect(isScormSequenceConflict(httpError(409, { code: 'execution_conflict' }))).toBe(false);
  });
});
