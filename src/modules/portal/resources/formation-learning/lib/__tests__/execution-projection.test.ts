import { mapSummaryToFormation } from '../summary-mapper';
import { buildExecutionContext, pendingStartExecutionId } from '../execution-context';
import { getDefaultActiveId, resolveActive } from '../course-utils';
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
  it.each([90, null, undefined])('projette la limite figée %s sans durée estimée', (minutes) => {
    const source = summary();
    source.final_evaluations[0].time_limit_minutes = minutes;
    const evaluation = mapEvaluation(source);
    expect(evaluation.timeLimitMinutes).toBe(minutes ?? null);
    expect(evaluation.durationMin).toBeUndefined();
  });

  it('projette aussi la limite des évaluations intermédiaires', () => {
    const source = summary();
    source.modules[0].evaluation = {
      ...source.final_evaluations[0],
      id: 'partial-evaluation',
      evaluation_type: 'PARTIAL',
      time_limit_minutes: 120,
    };
    const evaluation = mapSummaryToFormation(source).nodes.find(
      (node) => node.id === 'partial-evaluation',
    ) as FormationEvaluation;
    expect(evaluation.evaluationType).toBe('intermediate');
    expect(evaluation.timeLimitMinutes).toBe(120);
  });

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
    expect(second.execution.actionable).toBe(false);
    expect(second.status).toBe('locked');
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
    expect(module.courses[0].sections[0].contents.every((content) => !content.completed)).toBe(
      true,
    );
  });

  it('verrouille l’historique incomplet sans bloquer la séquence du module actif', () => {
    const data = summary({
      modules: [
        {
          ...LOOPED_MODULE,
          actionable: false,
          executionId: null,
          historicalCompleted: false,
          requiredToRepeat: false,
        },
        { ...LOOPED_MODULE, id: 'module-2' },
      ],
    });
    data.modules[0].history = [visit({ id: 'old-visit', status: 'cancelled' })];
    const formation = mapSummaryToFormation(data);
    const [historical, active] = formation.nodes as FormationModule[];
    expect(historical.status).toBe('locked');
    const contents = historical.courses[0].sections[0].contents;
    for (const content of contents) {
      expect(resolveActive(formation, content.id)).toBeNull();
    }
    expect(historical.execution.readExecutionId).toBe('old-visit');
    expect(buildExecutionContext(formation, historical.id)).toBeNull();
    expect(active.courses[0].sections[0].contents.map((content) => content.status)).toEqual([
      'retry',
      'locked',
    ]);
  });

  it.each([false, true])(
    'respecte la même séquence au premier passage et au repassage (repassage=%s)',
    (repeat) => {
      const module: ModuleSpec = {
        ...LOOPED_MODULE,
        requiredToRepeat: repeat,
        historicalCompleted: repeat,
        visitStatus: 'in_progress',
        courses: [
          {
            id: 'course-1',
            name: 'Découverte',
            entries: [
              { id: 'entry-1', title: 'Terminé', completed: true, historicalCompleted: repeat },
              { id: 'entry-2', title: 'En cours', historicalCompleted: repeat },
              { id: 'entry-3', title: 'Suivant', historicalCompleted: repeat },
            ],
          },
        ],
      };
      const data = summary({ modules: [module] });
      const formation = mapSummaryToFormation(data);
      const contents = (formation.nodes[0] as FormationModule).courses[0].sections[0].contents;
      expect(contents.map((content) => content.status)).toEqual([
        'completed',
        repeat ? 'retry' : 'available',
        'locked',
      ]);
      expect(resolveActive(formation, contents[0].id)?.kind).toBe('content');
      expect(resolveActive(formation, contents[1].id)?.kind).toBe('content');
      expect(resolveActive(formation, contents[2].id)).toBeNull();
      expect(getDefaultActiveId(formation)).toBe(contents[1].id);

      data.modules[0].courses[0].sections[0].content_entries[1].completed = true;
      expect(
        mapModule(data).courses[0].sections[0].contents.map((content) => content.status),
      ).toEqual(['completed', 'completed', repeat ? 'retry' : 'available']);
    },
  );

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

describe('Aperçu SCORM en lecture seule', () => {
  it('ferme la séquence jusqu’à sa validation comme les autres contenus', () => {
    const preview = summary({
      modules: [
        {
          id: 'module-1',
          name: 'Les bases',
          courses: [
            {
              id: 'course-1',
              name: 'Découverte',
              entries: [
                { id: 'entry-1', title: 'SCORM' },
                { id: 'entry-2', title: 'Contenu 2' },
                { id: 'entry-3', title: 'Contenu 3' },
              ],
            },
          ],
        },
      ],
    });
    preview.modules[0].courses[0].sections[0].content_entries[0].read_only = true;

    const contents = mapModule(preview).courses[0].sections[0].contents;

    expect(
      contents.map(({ entryId, readOnly, completed, status }) => ({
        entryId,
        readOnly,
        completed,
        status,
      })),
    ).toEqual([
      { entryId: 'entry-1', readOnly: true, completed: false, status: 'available' },
      { entryId: 'entry-2', readOnly: undefined, completed: false, status: 'locked' },
      { entryId: 'entry-3', readOnly: undefined, completed: false, status: 'locked' },
    ]);
    preview.modules[0].courses[0].sections[0].content_entries[0].completed = true;
    expect(
      mapModule(preview).courses[0].sections[0].contents.map((content) => content.status),
    ).toEqual(['completed', 'available', 'locked']);
  });
});
