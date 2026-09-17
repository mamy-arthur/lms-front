import { mapSummaryToFormation } from '../summary-mapper';
import { buildExecutionContext, pendingStartExecutionId } from '../execution-context';
import { getDefaultActiveId } from '../course-utils';
import {
  buildExecutionSummary,
  visit,
  type ModuleSpec,
  type SummarySpec,
} from '../__fixtures__/execution-summary';
import type { FormationEvaluation, FormationModule } from '../types';

/** Boucle : le module a déjà été terminé, mais le parcours y ramène. */
const LOOPED_MODULE: ModuleSpec = {
  id: 'module-1',
  name: 'Les bases',
  requiredToRepeat: true,
  historicalCompleted: true,
  visitStatus: 'available',
  courses: [
    {
      id: 'course-1',
      name: 'Découverte',
      entries: [
        { id: 'entry-1', title: 'Contenu 1', historicalCompleted: true },
        { id: 'entry-2', title: '', historicalCompleted: true },
      ],
    },
  ],
};

const FINAL_EVALUATION = {
  id: 'evaluation-1',
  title: 'Évaluation finale',
  minScorePercentage: 80,
  maxAttempts: 3,
  attemptsUsed: 1,
  remainingAttempts: 2,
};

function summary(overrides: Partial<SummarySpec> = {}) {
  return buildExecutionSummary({
    modules: [LOOPED_MODULE],
    finalEvaluations: [FINAL_EVALUATION],
    ...overrides,
  });
}

function mapModule(spec = summary()): FormationModule {
  return mapSummaryToFormation(spec).nodes[0] as FormationModule;
}

function mapEvaluation(spec = summary()): FormationEvaluation {
  return mapSummaryToFormation(spec).nodes.find(
    (node) => node.type === 'evaluation',
  ) as FormationEvaluation;
}

describe('Projection du snapshot d’exécution', () => {
  it('sépare le chemin actif de la couverture historique', () => {
    const formation = mapSummaryToFormation(summary());

    // Une couverture à 100 % ne rend pas le parcours acquis.
    expect(formation.progress).toBe(0);
    expect(formation.execution.coveragePercent).toBe(100);
    expect(formation.execution.completedCounts).toEqual({ historical: 2, activeRoute: 0 });
    expect(formation.execution.definitionId).toBe('definition-1');
    expect(formation.execution.stateRevision).toBe(7);
  });

  it('conserve l’obligation de rejouer un module déjà terminé', () => {
    const module = mapModule();

    expect(module.execution.historicalCompleted).toBe(true);
    expect(module.execution.requiredToRepeat).toBe(true);
    expect(module.status).toBe('retry');
    // Le contenu doit être revalidé : la preuve historique ne le marque pas terminé.
    const content = module.courses[0].sections[0].contents[0];
    expect(content.completed).toBe(false);
    expect(content.historicalCompleted).toBe(true);
    expect(content.status).toBe('retry');
  });

  it('n’ouvre que le premier contenu restant à faire', () => {
    const contents = mapModule().courses[0].sections[0].contents;

    // Sauter un contenu non terminé doit rester impossible dans la visite en cours.
    expect(contents.map((content) => content.status)).toEqual(['retry', 'locked']);
  });

  it('garde verrouillés les modules à refaire qui restent à venir', () => {
    const formation = mapSummaryToFormation(
      summary({
        modules: [
          LOOPED_MODULE,
          {
            ...LOOPED_MODULE,
            id: 'module-2',
            name: 'Approfondissement',
            actionable: false,
            courses: [
              {
                id: 'course-2',
                name: 'Suite',
                entries: [{ id: 'entry-3', title: 'Contenu 3', historicalCompleted: true }],
              },
            ],
          },
        ],
      }),
    );
    const [first, second] = formation.nodes as FormationModule[];

    // Le module en cours ouvre son premier contenu ; le rejeu suivant attend.
    expect(first.courses[0].sections[0].contents.map((content) => content.status)).toEqual([
      'retry',
      'locked',
    ]);
    expect(second.execution.requiredToRepeat).toBe(true);
    expect(second.courses[0].sections[0].contents.map((content) => content.status)).toEqual([
      'locked',
    ]);
  });

  it('verrouille le contenu non terminé d’un nœud hors de la visite en cours', () => {
    const module = mapModule(
      summary({
        modules: [{ ...LOOPED_MODULE, actionable: false, requiredToRepeat: false }],
      }),
    );

    // Une preuve historique n’est pas une preuve du passage en cours.
    expect(module.courses[0].sections[0].contents.map((content) => content.status)).toEqual([
      'locked',
      'locked',
    ]);
  });

  it('laisse l’historique lisible sans le rendre modifiable', () => {
    const module = mapModule(
      summary({
        modules: [{ ...LOOPED_MODULE, actionable: false, requiredToRepeat: false }],
      }),
    );

    expect(module.execution.readable).toBe(true);
    expect(module.execution.actionable).toBe(false);
    expect(module.status).toBe('completed');
  });

  it('verrouille un nœud jamais visité', () => {
    const module = mapModule(
      summary({
        modules: [{ ...LOOPED_MODULE, actionable: false, readable: false, executionId: null }],
      }),
    );

    expect(module.status).toBe('locked');
    expect(module.courses[0].sections[0].contents[0].status).toBe('locked');
  });

  it('reprend le seuil et le budget figés de l’évaluation', () => {
    const evaluation = mapEvaluation();

    // Seuil de la règle snapshotée, pas la constante du frontend.
    expect(evaluation.passingScore).toBe(80);
    expect(evaluation.execution.round?.remaining_attempts).toBe(2);
    expect(evaluation.evaluationType).toBe('final');
  });

  it('marque les statuts terminaux', () => {
    const failed = mapSummaryToFormation(summary({ status: 'failed', currentExecution: null }));

    expect(failed.execution.terminal).toBe(true);
    expect(failed.execution.status).toBe('failed');
  });

  it('supporte une section figée sans identité et un titre absent', () => {
    const module = mapModule();
    const section = module.courses[0].sections[0];

    expect(section.id).toBe('course-1:frozen:0');
    expect(section.contents[1].title).toBe('');
    // Le portail lit l'entrée via /courses/{courseId}/entries/{entryId}.
    expect(section.contents[0].courseId).toBe('course-1');
  });

  it('place les évaluations finales après les modules', () => {
    const formation = mapSummaryToFormation(summary());

    expect(formation.nodes.map((node) => node.id)).toEqual(['module-1', 'evaluation-1']);
  });

  it('marque une évaluation à repasser et y ramène la navigation par défaut', () => {
    const looping = summary({
      modules: [{ ...LOOPED_MODULE, actionable: false, requiredToRepeat: false }],
      finalEvaluations: [{ ...FINAL_EVALUATION, actionable: true }],
    });
    looping.final_evaluations[0].required_to_repeat = true;
    looping.execution.current_execution = looping.final_evaluations[0].current_execution;
    const formation = mapSummaryToFormation(looping);

    expect(mapEvaluation(looping).status).toBe('retry');
    // L'atterrissage suit le nœud actionable, pas le premier contenu lisible.
    expect(getDefaultActiveId(formation)).toBe('evaluation-1');
  });
});

describe('Contexte de mutation', () => {
  it('conserve une visite historique pour la lecture sans l’utiliser pour une mutation', () => {
    const data = summary({
      modules: [{ ...LOOPED_MODULE, actionable: false, executionId: null }],
    });
    data.modules[0].history = [
      visit({ id: 'visit-2', visit_number: 2, status: 'completed' }),
      visit({ id: 'visit-1', visit_number: 1, status: 'completed' }),
    ];
    const formation = mapSummaryToFormation(data);
    expect(formation.nodes[0].execution.readExecutionId).toBe('visit-2');
    expect(buildExecutionContext(formation, 'module-1')).toBeNull();
  });

  it('préfère la nouvelle visite de la route active à l’historique pour le lancement', () => {
    const data = summary();
    data.modules[0].history = [visit({ id: 'old-visit', status: 'completed' })];
    expect(mapSummaryToFormation(data).nodes[0].execution.readExecutionId).toBe('exec-module-1');
  });

  it('ne fournit aucun contexte de lecture à un nœud non lisible', () => {
    const data = summary({ modules: [{ ...LOOPED_MODULE, readable: false, actionable: false }] });
    expect(mapSummaryToFormation(data).nodes[0].execution.readExecutionId).toBeNull();
  });

  it('joint la visite du nœud concerné et la révision lue', () => {
    const formation = mapSummaryToFormation(summary());

    expect(buildExecutionContext(formation, 'module-1')).toEqual({
      node_execution_id: 'exec-module-1',
      expected_state_revision: 7,
    });
  });

  it('n’emprunte pas la visite d’un autre nœud', () => {
    const formation = mapSummaryToFormation(summary());

    // L'évaluation n'a pas de visite ouverte : aucun identifiant n'est inventé,
    // et l'action reste bloquée plutôt que de partir sans contexte.
    expect(buildExecutionContext(formation, 'evaluation-1')).toBeNull();
  });
});

describe('Visite à démarrer', () => {
  it('ne retient qu’une visite rendue disponible par le serveur', () => {
    expect(pendingStartExecutionId(mapSummaryToFormation(summary()))).toBe('exec-module-1');

    const started = summary({ modules: [{ ...LOOPED_MODULE, visitStatus: 'in_progress' }] });
    expect(pendingStartExecutionId(mapSummaryToFormation(started))).toBeNull();
  });

  it('ne démarre rien sur une inscription terminale', () => {
    const expired = summary({
      status: 'expired',
      currentExecution: visit({ status: 'available' }),
    });

    expect(pendingStartExecutionId(mapSummaryToFormation(expired))).toBeNull();
  });
});
