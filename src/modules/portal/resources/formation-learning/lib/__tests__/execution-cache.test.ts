import { QueryClient } from '@tanstack/react-query';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import { adoptExecutionSnapshot } from '../execution-cache';
import { mapSummaryToFormation } from '../summary-mapper';
import { buildExecutionSummary, ENROLLMENT_ID, visit } from '../__fixtures__/execution-summary';

const MODULE = {
  id: 'module-1',
  name: 'Les bases',
  courses: [
    { id: 'course-1', name: 'Découverte', entries: [{ id: 'entry-1', title: 'Contenu 1' }] },
  ],
};

function seed() {
  const summary = buildExecutionSummary({ modules: [MODULE] });
  const client = new QueryClient();
  client.setQueryData(
    portalLearningPathKeys.summary(ENROLLMENT_ID),
    mapSummaryToFormation(summary),
  );

  return { client, summary };
}

describe('Adoption du snapshot d’exécution', () => {
  it('pose la révision et la visite rapportées par l’écriture', () => {
    const { client, summary } = seed();
    const current = visit({ id: 'exec-module-1', node_id: 'module-1', status: 'in_progress' });

    adoptExecutionSnapshot(client, ENROLLMENT_ID, {
      ...summary.execution,
      state_revision: 42,
      current_execution: current,
    });

    const formation = client.getQueryData(
      portalLearningPathKeys.summary(ENROLLMENT_ID),
    ) as ReturnType<typeof mapSummaryToFormation>;
    expect(formation.execution.stateRevision).toBe(42);
    expect(formation.execution.currentExecution).toEqual(current);
    // Les libellés ne viennent pas du snapshot : seul le rechargement les reconstruit.
    expect(formation.nodes[0].title).toBe('Les bases');
  });

  it('marque l’inscription terminale quand l’écriture la clôt', () => {
    const { client, summary } = seed();

    adoptExecutionSnapshot(client, ENROLLMENT_ID, {
      ...summary.execution,
      status: 'failed',
      current_execution: null,
    });

    const formation = client.getQueryData(
      portalLearningPathKeys.summary(ENROLLMENT_ID),
    ) as ReturnType<typeof mapSummaryToFormation>;
    expect(formation.execution.status).toBe('failed');
    expect(formation.execution.terminal).toBe(true);
  });

  it('ne fabrique rien quand le résumé n’a jamais été chargé', () => {
    const client = new QueryClient();
    const summary = buildExecutionSummary({ modules: [MODULE] });

    adoptExecutionSnapshot(client, ENROLLMENT_ID, summary.execution);

    expect(client.getQueryData(portalLearningPathKeys.summary(ENROLLMENT_ID))).toBeUndefined();
  });
});
