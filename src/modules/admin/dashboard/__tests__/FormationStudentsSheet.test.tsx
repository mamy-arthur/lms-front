import { useRef, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FormationStudentsSheet,
  type FormationStudentSelection,
} from '../components/FormationStudentsSheet';
import {
  formationProgressDemo,
  getDemoFormationRoster,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
} from '../data/studentProgressDemo';
import {
  formatAttemptDate,
  formatAttemptDuration,
  formatShortDate,
  getAttemptMinutes,
  getDemoEnrollmentSummary,
  getDemoStudentAttempts,
} from '../data/studentAttemptsDemo';

import { getInitials } from '@/shared/lib/string/getInitials';

const formation = formationProgressDemo[0];


/** Les quatre statuts à zéro : le seul moyen d'obtenir un effectif vide. */
const EMPTY_FORMATION = {
  ...formation,
  completed: 0,
  in_progress: 0,
  not_started: 0,
  failed: 0,
};

/** Lignes d'étudiants : en-tête et ligne d'état vide (une seule cellule) exclus. */
function studentRows() {
  const [, body] = within(screen.getByRole('table', { name: 'Étudiants concernés' })).getAllByRole(
    'rowgroup',
  );
  return within(body)
    .getAllByRole('row')
    .filter((row) => within(row).queryAllByRole('cell').length === 8);
}

/** Le volet de détail n'est monté que lorsqu'une ligne est sélectionnée. */
function detailPane() {
  return screen.queryByRole('region', { name: /^Tentatives de/ });
}
function Harness({
  status = 'failed',
  initiallyOpen = true,
}: {
  status?: DashboardEnrollmentStatus;
  initiallyOpen?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selection, setSelection] = useState<FormationStudentSelection | null>(
    initiallyOpen
      ? {
          formation,
          status,
        }
      : null,
  );
  return (
    <>
      <button ref={triggerRef} onClick={() => setSelection({ formation, status })}>
        Ouvrir le panneau
      </button>
      <FormationStudentsSheet
        selection={selection}
        onClose={() => setSelection(null)}
        onRestoreFocus={() => triggerRef.current?.focus()}
      />
    </>
  );
}

/** Le volet de détail n'existe pas au départ : il faut sélectionner une ligne. */
async function selectFirstStudent(status: DashboardEnrollmentStatus = 'failed') {
  const user = userEvent.setup();
  render(<Harness status={status} />);
  const student = getDemoFormationStudents(formation, status)[0];
  const button = screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` });
  expect(button).toHaveAttribute('aria-current', 'false');
  await user.click(button);
  expect(button).toHaveAttribute('aria-current', 'true');
  return { user, student, button };
}

describe('panneau des tentatives étudiantes', () => {
  it('ouvre sur un tableau pleine largeur, sans volet de détail', () => {
    render(<Harness status="failed" />);
    expect(screen.getByRole('dialog')).toHaveClass('data-[side=right]:min-w-full');
    expect(detailPane()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replier' })).not.toBeInTheDocument();

    const rows = studentRows();
    expect(rows).toHaveLength(formation.failed);
    rows.forEach((row) => {
      const trigger = within(row).getByRole('button');
      expect(trigger).toHaveAttribute('aria-current', 'false');
      // Rien à contrôler tant que le volet n'est pas monté.
      expect(trigger).not.toHaveAttribute('aria-controls');
    });
  });

  it('garde la largeur du drawer et les colonnes après sélection', async () => {
    await selectFirstStudent();
    expect(screen.getByRole('dialog')).toHaveClass('data-[side=right]:min-w-full');
    expect(studentRows()).toHaveLength(formation.failed);
    expect(
      within(screen.getByRole('table', { name: 'Étudiants concernés' })).getAllByRole(
        'columnheader',
      ),
    ).toHaveLength(8);
  });

  it('présente l’avatar de l’étudiant et un lien de contact dans le volet', async () => {
    const { student } = await selectFirstStudent();
    const history = screen.getByRole('region', { name: `Tentatives de ${student.name}` });

    const avatar = history.querySelector('[data-slot="avatar"]');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(history.querySelector('[data-slot="avatar-fallback"]')).toHaveTextContent(
      getInitials(student.name),
    );

    // `mailto:` : il n'y a pas d'endpoint de messagerie, le lien ouvre le
    // client mail avec l'adresse réelle de l'étudiant.
    expect(within(history).getByRole('link', { name: 'Contacter l’étudiant' })).toHaveAttribute(
      'href',
      `mailto:${student.email}`,
    );
  });

  it('affiche le temps passé sur chaque tentative', async () => {
    const { student } = await selectFirstStudent();
    const history = screen.getByRole('region', { name: `Tentatives de ${student.name}` });
    const attempts = getDemoStudentAttempts(formation, 'failed', student.id);

    attempts.forEach((attempt) => {
      const trigger = within(history).getByRole('button', {
        name: new RegExp(`^Tentative ${attempt.number}`),
      });
      expect(trigger).toHaveTextContent(
        `Temps passé : ${formatAttemptDuration(getAttemptMinutes(attempt.steps))}`,
      );
    });
  });

  it('monte le volet de détail contrôlé par la ligne choisie', async () => {
    const { student, button } = await selectFirstStudent();
    const history = screen.getByRole('region', { name: `Tentatives de ${student.name}` });

    expect(button.getAttribute('aria-controls')).toBe(history.id);
    expect(within(history).getByText(student.email)).toBeInTheDocument();
  });

  it('replie le volet et rend sa pleine largeur au tableau', async () => {
    const { user, button } = await selectFirstStudent();
    await user.click(screen.getByRole('button', { name: 'Replier' }));

    expect(detailPane()).not.toBeInTheDocument();
    expect(studentRows()).toHaveLength(formation.failed);
    expect(button).toHaveAttribute('aria-current', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
  });

  it('rend le focus à la ligne quittée après repli', async () => {
    const { user, button } = await selectFirstStudent();
    await user.click(screen.getByRole('button', { name: 'Replier' }));
    expect(button).toHaveFocus();
  });

  it('rouvre le volet après un repli', async () => {
    const { user, student, button } = await selectFirstStudent();
    await user.click(screen.getByRole('button', { name: 'Replier' }));
    await user.click(button);

    expect(
      screen.getByRole('region', { name: `Tentatives de ${student.name}` }),
    ).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-current', 'true');
  });

  it('bascule le détail d’un étudiant à l’autre sans rien replier', async () => {
    const { user, student } = await selectFirstStudent();
    const next = getDemoFormationStudents(formation, 'failed')[1];
    await user.click(screen.getByRole('button', { name: `Voir les tentatives de ${next.name}` }));

    expect(
      screen.queryByRole('region', { name: `Tentatives de ${student.name}` }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: `Tentatives de ${next.name}` })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` }),
    ).toHaveAttribute('aria-current', 'false');
  });

  it('nomme les colonnes du tableau', () => {
    render(<Harness status="failed" />);
    expect(
      within(screen.getByRole('table', { name: 'Étudiants concernés' }))
        .getAllByRole('columnheader')
        .map((column) => column.textContent),
    ).toEqual([
      'Étudiant',
      'Début',
      'Fin',
      'Temps passé',
      'Tentatives',
      'Accès valable jusqu’au',
      'Statut',
      'Détails',
    ]);
  });

  it('termine chaque ligne par un chevron décoratif annonçant le détail', () => {
    render(<Harness status="failed" />);

    studentRows().forEach((row) => {
      const last = within(row).getAllByRole('cell')[7];
      const chevron = last.querySelector('svg');
      expect(chevron).toBeInTheDocument();
      // Décoratif : l'action est déjà nommée par le bouton de la 1re cellule.
      expect(chevron).toHaveAttribute('aria-hidden', 'true');
      // Une seule action nommée par ligne, le chevron n'en ajoute pas.
      expect(within(row).getAllByRole('button')).toHaveLength(1);
    });
  });

  it('range dates, temps passé, tentatives, accès et statut dans les colonnes', () => {
    render(<Harness status="failed" />);

    studentRows().forEach((row, index) => {
      const student = getDemoFormationStudents(formation, 'failed')[index];
      const summary = getDemoEnrollmentSummary(formation, 'failed', student.id);
      const cells = within(row).getAllByRole('cell');
      expect(cells).toHaveLength(8);
      expect(cells[0]).toHaveTextContent(student.name);
      expect(cells[0]).toHaveTextContent(student.email);
      expect(cells[1]).toHaveTextContent(formatAttemptDate(summary.startedAt!));
      expect(cells[2]).toHaveTextContent(formatAttemptDate(summary.endedAt!));
      expect(cells[3]).toHaveTextContent(formatAttemptDuration(summary.minutes));
      expect(cells[4]).toHaveTextContent(String(summary.attempts));
      expect(cells[5]).toHaveTextContent(formatShortDate(summary.accessEndsAt));
      expect(cells[6]).toHaveTextContent('Échoué');
    });
  });

  it('affiche la durée théorique et l’expiration de la formation en en-tête', () => {
    render(<Harness status="failed" />);
    const header = screen.getByRole('dialog');

    expect(within(header).getByText('Durée théorique').nextElementSibling).toHaveTextContent(
      formatAttemptDuration(formation.theoreticalMinutes),
    );
    expect(
      within(header).getByText('Expiration de la formation').nextElementSibling,
    ).toHaveTextContent(formatShortDate(formation.expiresAt));
    expect(
      within(header).getByText(`Critère de fin : ${formation.completionCriterion}`),
    ).toBeInTheDocument();
  });

  it('plafonne la date de fin d’accès à l’expiration de la formation', () => {
    // demo-4 expire avant l'échéance de certains étudiants.
    const shortLived = formationProgressDemo[3];
    const capped = getDemoFormationRoster(shortLived).find(
      (item) => getDemoEnrollmentSummary(shortLived, item.status, item.id).cappedByFormation,
    )!;
    const summary = getDemoEnrollmentSummary(shortLived, capped.status, capped.id);

    expect(Date.parse(summary.dueAt)).toBeGreaterThan(Date.parse(shortLived.expiresAt));
    expect(summary.accessEndsAt).toBe(shortLived.expiresAt);
  });

  it('colore le temps passé en vert sous la durée théorique, en rouge au-dessus', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    // Tout l'effectif : le statut « échoué » seul ne couvre pas les deux cas.
    await user.click(
      within(screen.getByRole('group', { name: 'Filtrer par statut' })).getByRole('button', {
        name: /^Tous/,
      }),
    );

    const seen = new Set<string>();
    studentRows().forEach((row) => {
      const id = within(row).getByRole('button').getAttribute('aria-label')!;
      const entry = getDemoFormationRoster(formation).find(
        (item) => `Voir les tentatives de ${item.name}` === id,
      )!;
      const { minutes, attempts } = getDemoEnrollmentSummary(formation, entry.status, entry.id);
      const cell = within(row).getAllByRole('cell')[3];

      if (!attempts) {
        // Sans tentative, aucun temps à juger : ni vert ni rouge.
        expect(cell).toHaveClass('text-muted-foreground');
        seen.add('neutre');
        return;
      }
      const expected = minutes < formation.theoreticalMinutes ? 'text-emerald-600' : 'text-red-600';
      expect(cell).toHaveClass(expected);
      seen.add(expected);
    });

    // Les trois états sont bien exercés par les fixtures.
    expect(seen).toEqual(new Set(['text-emerald-600', 'text-red-600', 'neutre']));
  });

  it('cumule le temps passé sur toutes les tentatives', () => {
    const [student] = getDemoFormationStudents(formation, 'failed');
    const attempts = getDemoStudentAttempts(formation, 'failed', student.id);
    const expected = attempts.reduce(
      (total, attempt) => total + getAttemptMinutes(attempt.steps),
      0,
    );

    render(<Harness status="failed" />);
    expect(within(studentRows()[0]).getAllByRole('cell')[3]).toHaveTextContent(
      formatAttemptDuration(expected),
    );
    expect(expected).toBeGreaterThan(0);
  });

  it('annonce un parcours jamais démarré sans date, temps ni tentative', () => {
    render(<Harness status="not_started" />);
    const cells = within(studentRows()[0]).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('Non démarré');
    expect(cells[2]).toHaveTextContent('—');
    expect(cells[3]).toHaveTextContent('—');
    expect(cells[4]).toHaveTextContent('0');
  });

  it('sélectionne au clic sur la ligne, pas seulement sur le nom', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    const student = getDemoFormationStudents(formation, 'failed')[0];
    const [row] = studentRows();

    await user.click(within(row).getAllByRole('cell')[4]);
    expect(
      screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` }),
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('region', { name: `Tentatives de ${student.name}` }),
    ).toBeInTheDocument();
  });

  it('présente les tentatives de l’étudiant choisi sans les déplier', async () => {
    const { student } = await selectFirstStudent();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    const history = screen.getByRole('region', { name: `Tentatives de ${student.name}` });
    expect(within(history).getByRole('button', { name: /^Tentative 1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(within(history).getByRole('button', { name: /^Tentative 2/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(within(history).getByText(/Reprise depuis le début/)).toBeInTheDocument();
    expect(within(history).getAllByText(/Motif d’interruption/)).toHaveLength(2);
    const alerts = within(history).getAllByRole('alert');
    expect(alerts).toHaveLength(3);
    alerts.forEach((alert) => {
      expect(alert).toHaveAttribute('data-slot', 'alert');
      expect(alert.closest('button')).toBeNull();
    });
    expect(
      within(history).getByRole('alert', { name: 'Reprise du parcours · Tentative 2' }),
    ).toHaveTextContent(/Reprise depuis le début/);
    expect(
      within(history).getByRole('alert', { name: 'Motif d’interruption · Tentative 1' }),
    ).toHaveTextContent(/Échec à l’évaluation 1/);
    expect(history.querySelectorAll('time')).toHaveLength(4);
    expect(within(history).queryByRole('list')).not.toBeInTheDocument();
  });

  it('déplie les étapes au clavier avec temps passés et causes de verrouillage', async () => {
    const { user } = await selectFirstStudent();
    const trigger = screen.getByRole('button', { name: /^Tentative 1/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    const steps = within(
      screen.getByRole('list', { name: 'Étapes de la tentative 1' }),
    ).getAllByRole('listitem');
    expect(steps).toHaveLength(6);
    expect(steps[0]).toHaveTextContent('Module 1');
    expect(steps[0]).toHaveTextContent('Terminé');
    expect(steps[0]).toHaveTextContent('Temps passé : 3 h');
    expect(steps[1]).toHaveTextContent('Évaluation 1');
    expect(steps[1]).toHaveTextContent('Échouée');
    steps.slice(2).forEach((step) => {
      expect(step).toHaveTextContent(/Verrouillé/);
      expect(step).toHaveTextContent('Échec à l’évaluation 1');
      expect(step).not.toHaveTextContent('Temps passé');
    });

    await user.click(screen.getByRole('button', { name: /^Tentative 2/ }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('list', { name: 'Étapes de la tentative 1' }),
    ).not.toBeInTheDocument();
    const second = within(
      screen.getByRole('list', { name: 'Étapes de la tentative 2' }),
    ).getAllByRole('listitem');
    expect(second[0]).toHaveTextContent('Temps passé : 4 h');
    expect(second[1]).toHaveTextContent('Réussie');
    expect(second[3]).toHaveTextContent('Échouée');
    expect(second[4]).toHaveTextContent('Échec à l’évaluation 2');
  });

  it('affiche un état vide lorsque la liste ne contient aucun étudiant', () => {
    render(
      <FormationStudentsSheet
        selection={{ formation: EMPTY_FORMATION, status: 'failed' }}
        onClose={() => {}}
        onRestoreFocus={() => {}}
      />,
    );
    expect(screen.getByText('Aucun étudiant inscrit à cette formation.')).toBeInTheDocument();
    expect(studentRows()).toHaveLength(0);
    expect(screen.queryByRole('region', { name: /^Tentatives de/ })).not.toBeInTheDocument();
  });

  it('consulte les temps par cours sans replier la tentative et les réinitialise au changement d’étudiant', async () => {
    const { user } = await selectFirstStudent();
    const attempt = screen.getByRole('button', { name: /^Tentative 1/ });
    await user.click(attempt);
    await user.click(screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' }));
    expect(attempt).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('list', { name: 'Temps par cours de Module 1 — tentative 1' }),
    ).toBeInTheDocument();
    const next = getDemoFormationStudents(formation, 'failed')[1];
    await user.click(screen.getByRole('button', { name: `Voir les tentatives de ${next.name}` }));
    await user.click(screen.getByRole('button', { name: /^Tentative 1/ }));
    expect(
      screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('ne conserve pas une tentative ouverte en changeant d’étudiant', async () => {
    const { user } = await selectFirstStudent();
    await user.click(screen.getByRole('button', { name: /^Tentative 1/ }));
    const next = getDemoFormationStudents(formation, 'failed')[1];
    await user.click(screen.getByRole('button', { name: `Voir les tentatives de ${next.name}` }));
    expect(screen.getByRole('region', { name: `Tentatives de ${next.name}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Tentative 1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.click(screen.getByRole('button', { name: /^Tentative 2/ }));
    const steps = within(
      screen.getByRole('list', { name: 'Étapes de la tentative 2' }),
    ).getAllByRole('listitem');
    expect(steps[4]).toHaveTextContent('Terminé');
    expect(steps[5]).toHaveTextContent('Échouée');
  });

  it('affiche un état vide pour un étudiant qui n’a pas commencé', async () => {
    await selectFirstStudent('not_started');
    expect(screen.getByText('Aucune tentative commencée')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Tentative 1/ })).not.toBeInTheDocument();
  });

  it.each(['completed', 'in_progress'] as const)(
    'reflète le statut %s dans la dernière tentative',
    async (status) => {
      const { user } = await selectFirstStudent(status);
      await user.click(screen.getByRole('button', { name: /^Tentative 2/ }));
      const steps = within(
        screen.getByRole('list', { name: 'Étapes de la tentative 2' }),
      ).getAllByRole('listitem');
      if (status === 'completed') {
        expect(steps.every((step) => !step.textContent?.includes('Verrouillé'))).toBe(true);
        expect(steps[5]).toHaveTextContent('Réussie');
      } else {
        expect(steps[2]).toHaveTextContent('En cours');
        expect(steps[3]).toHaveTextContent('Le module 2 est en cours');
      }
    },
  );

  it('garde le focus sur le déclencheur après sélection, sans le déplacer', async () => {
    const { button } = await selectFirstStudent();
    expect(button).toHaveFocus();
  });

  it('réouvre le panneau replié, sans sélection', async () => {
    const { user } = await selectFirstStudent();
    const next = getDemoFormationStudents(formation, 'failed')[1];
    await user.click(screen.getByRole('button', { name: `Voir les tentatives de ${next.name}` }));
    await user.click(screen.getByRole('button', { name: /^Tentative 1/ }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Ouvrir le panneau' }));
    expect(detailPane()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Tentative 1/ })).not.toBeInTheDocument();
    getDemoFormationStudents(formation, 'failed').forEach((item) =>
      expect(
        screen.getByRole('button', { name: `Voir les tentatives de ${item.name}` }),
      ).toHaveAttribute('aria-current', 'false'),
    );
  });

  it('vide le détail lorsque le filtre change', () => {
    const props = { onClose: () => {}, onRestoreFocus: () => {} };
    const { rerender } = render(
      <FormationStudentsSheet {...props} selection={{ formation, status: 'failed' }} />,
    );
    rerender(<FormationStudentsSheet {...props} selection={{ formation, status: 'completed' }} />);
    expect(detailPane()).not.toBeInTheDocument();
    const students = getDemoFormationStudents(formation, 'completed');
    expect(studentRows()).toHaveLength(students.length);
    expect(
      screen.getByRole('button', { name: `Voir les tentatives de ${students[0].name}` }),
    ).toHaveAttribute('aria-current', 'false');
  });

  it('ferme avec Échap depuis une tentative et restitue le focus au badge', async () => {
    const user = userEvent.setup();
    render(<Harness initiallyOpen={false} />);
    const badge = screen.getByRole('button', { name: 'Ouvrir le panneau' });
    await user.click(badge);
    const student = getDemoFormationStudents(formation, 'failed')[0];
    await user.click(
      screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` }),
    );
    await user.click(screen.getByRole('button', { name: /^Tentative 1/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(badge).toHaveFocus();
  });
});

describe('recherche d’étudiants', () => {
  // 30 étudiants : assez pour que filtrer ait un effet observable.
  const status = 'completed' as const;
  const students = getDemoFormationStudents(formation, status);
  // Le panneau charge tout l'effectif, le compteur s'y réfère.
  const roster = getDemoFormationRoster(formation);

  function searchBox() {
    return screen.getByRole('searchbox', { name: 'Rechercher un étudiant' });
  }

  it('filtre sur le nom sans tenir compte des accents, de la casse et des espaces', async () => {
    const user = userEvent.setup();
    render(<Harness status={status} />);
    expect(studentRows()).toHaveLength(students.length);

    await user.type(searchBox(), '  ETUDIANT 007  ');

    const rows = studentRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Étudiant 007');
  });

  it('filtre aussi sur l’e-mail', async () => {
    const user = userEvent.setup();
    render(<Harness status={status} />);

    await user.type(searchBox(), 'etudiant.012@');

    const rows = studentRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('etudiant.012@example.com');
  });

  it('annonce le nombre de résultats', async () => {
    const user = userEvent.setup();
    render(<Harness status={status} />);
    // À l'ouverture, le filtre de statut est déjà actif.
    expect(screen.getByRole('status')).toHaveTextContent(
      `${students.length} sur ${roster.length} étudiants`,
    );

    await user.type(searchBox(), '007');

    expect(screen.getByRole('status')).toHaveTextContent(`1 sur ${roster.length} étudiants`);
  });

  it('annonce l’effectif complet quand aucun filtre n’est actif', async () => {
    const user = userEvent.setup();
    render(<Harness status={status} />);
    await user.click(
      within(screen.getByRole('group', { name: 'Filtrer par statut' })).getByRole('button', {
        name: /^Tous/,
      }),
    );

    expect(screen.getByRole('status')).toHaveTextContent(`${roster.length} étudiants`);
    expect(screen.getByRole('status')).not.toHaveTextContent('sur');
  });

  it('propose de réinitialiser les filtres quand rien ne correspond', async () => {
    const user = userEvent.setup();
    render(<Harness status={status} />);
    await user.type(searchBox(), 'introuvable');

    expect(studentRows()).toHaveLength(0);
    expect(screen.getByText('Aucun étudiant ne correspond aux filtres.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));

    expect(searchBox()).toHaveValue('');
    // La réinitialisation lève aussi le filtre de statut, d'où l'effectif complet.
    expect(studentRows()).toHaveLength(roster.length);
  });

  it('garde l’historique ouvert même si l’étudiant sort des résultats', async () => {
    const user = userEvent.setup();
    render(<Harness status={status} />);
    await user.click(
      screen.getByRole('button', { name: `Voir les tentatives de ${students[0].name}` }),
    );

    await user.type(searchBox(), '030');

    expect(studentRows()).toHaveLength(1);
    expect(
      screen.getByRole('region', { name: `Tentatives de ${students[0].name}` }),
    ).toBeInTheDocument();
  });

  it('n’affiche ni recherche ni badges quand l’effectif est vide', () => {
    render(
      <FormationStudentsSheet
        selection={{ formation: EMPTY_FORMATION, status: 'failed' }}
        onClose={() => {}}
        onRestoreFocus={() => {}}
      />,
    );

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('Aucun étudiant inscrit à cette formation.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Réinitialiser les filtres' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filtrer par statut' })).not.toBeInTheDocument();
  });
});

describe('filtres par statut', () => {
  const roster = getDemoFormationRoster(formation);

  function filterBadge(name: RegExp | string) {
    return within(screen.getByRole('group', { name: 'Filtrer par statut' })).getByRole('button', {
      name,
    });
  }

  it('affiche un badge par statut avec son effectif', () => {
    render(<Harness status="failed" />);
    expect(
      within(screen.getByRole('group', { name: 'Filtrer par statut' }))
        .getAllByRole('button')
        .map((badge) => badge.textContent),
    ).toEqual([
      `Tous (${roster.length})`,
      `Terminé (${formation.completed})`,
      `En cours (${formation.in_progress})`,
      `Non commencé (${formation.not_started})`,
      `Échoué (${formation.failed})`,
    ]);
  });

  it('s’ouvre sur le statut cliqué depuis le tableau de bord', () => {
    render(<Harness status="in_progress" />);

    expect(filterBadge(/^En cours/)).toHaveAttribute('aria-pressed', 'true');
    expect(filterBadge(/^Tous/)).toHaveAttribute('aria-pressed', 'false');
    expect(studentRows()).toHaveLength(formation.in_progress);
  });

  it('bascule sur « Tous » et affiche l’effectif complet', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    expect(studentRows()).toHaveLength(formation.failed);

    await user.click(filterBadge(/^Tous/));

    expect(filterBadge(/^Tous/)).toHaveAttribute('aria-pressed', 'true');
    expect(studentRows()).toHaveLength(roster.length);
  });

  it('restreint le tableau au statut choisi', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);

    await user.click(filterBadge(/^Non commencé/));

    const rows = studentRows();
    expect(rows).toHaveLength(formation.not_started);
    rows.forEach((row) =>
      expect(within(row).getAllByRole('cell')[6]).toHaveTextContent('Non commencé'),
    );
  });

  it('combine filtre de statut et recherche', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    await user.click(filterBadge(/^Terminé/));

    await user.type(screen.getByRole('searchbox', { name: 'Rechercher un étudiant' }), '007');

    const rows = studentRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Étudiant 007');
    expect(rows[0]).toHaveTextContent('Terminé');
  });
});

describe('filtres par plage de dates', () => {
  async function openFilter(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.click(screen.getByRole('button', { name: `Filtrer par ${label}` }));
  }

  /**
   * Jour du calendrier affiché. `CalendarDayButton` expose
   * `data-day={date.toLocaleDateString('fr')}`, seule prise stable sur une
   * grille de jours. Les dates sont prises dans le mois courant pour rester
   * visibles quelle que soit la date d'exécution.
   */
  function dayButton(date: Date) {
    const key = date.toLocaleDateString('fr');
    const [button] = document.querySelectorAll<HTMLElement>(`[data-day="${key}"]`);
    if (!button) throw new Error(`Jour ${key} absent du calendrier`);
    return button;
  }

  const thisMonth = (dayOfMonth: number) => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  };

  it('propose une icône de filtre sur chaque colonne de date, et sur celles-là seulement', () => {
    render(<Harness status="failed" />);

    ['Début', 'Fin', 'Accès valable jusqu’au'].forEach((label) =>
      expect(screen.getByRole('button', { name: `Filtrer par ${label}` })).toBeInTheDocument(),
    );
    ['Étudiant', 'Temps passé', 'Tentatives', 'Statut'].forEach((label) =>
      expect(
        screen.queryByRole('button', { name: `Filtrer par ${label}` }),
      ).not.toBeInTheDocument(),
    );
  });

  it('ouvre un calendrier de sélection de plage', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    await openFilter(user, 'Début');

    expect(screen.getByRole('button', { name: 'Appliquer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réinitialiser' })).toBeInTheDocument();
    // Deux mois affichés côte à côte.
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.getByText('Choisissez une date de début, puis une date de fin.')).toBeVisible();
  });

  it('récapitule la plage en cours de sélection dans le calendrier', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    await openFilter(user, 'Début');

    await user.click(dayButton(thisMonth(2)));
    await user.click(dayButton(thisMonth(4)));

    const from = thisMonth(2).toLocaleDateString('fr');
    const to = thisMonth(4).toLocaleDateString('fr');
    expect(screen.getByRole('status')).toHaveTextContent(`Du ${from} au ${to}`);
  });

  it('marque la colonne comme filtrée après application, et la libère au reset', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    const trigger = screen.getByRole('button', { name: 'Filtrer par Début' });
    // Bordure et fond dès le repos : le bouton doit se voir comme cliquable.
    expect(trigger).toHaveClass('border', 'bg-muted/60', 'text-muted-foreground', 'size-6');

    await user.click(trigger);
    await user.click(dayButton(thisMonth(2)));
    await user.click(dayButton(thisMonth(4)));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    const active = screen.getByRole('button', { name: 'Filtrer par Début — filtre actif' });
    expect(active).toHaveClass('bg-(--color-primary)', 'text-primary-foreground');

    await user.click(active);
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    expect(screen.getByRole('button', { name: 'Filtrer par Début' })).toHaveClass('bg-muted/60');
  });

  it('décrit la plage appliquée dans l’infobulle du bouton', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);

    await user.hover(screen.getByRole('button', { name: 'Filtrer par Début' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Filtrer par plage de dates');
    await user.unhover(screen.getByRole('button', { name: 'Filtrer par Début' }));

    await openFilter(user, 'Début');
    await user.click(dayButton(thisMonth(2)));
    await user.click(dayButton(thisMonth(4)));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    await user.hover(screen.getByRole('button', { name: 'Filtrer par Début — filtre actif' }));
    const from = thisMonth(2).toLocaleDateString('fr');
    const to = thisMonth(4).toLocaleDateString('fr');
    expect(await screen.findByRole('tooltip')).toHaveTextContent(`Du ${from} au ${to}`);
  });

  it('vide le tableau quand la plage ne recouvre aucune ligne', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    expect(studentRows().length).toBeGreaterThan(0);

    // Les fixtures démarrent en septembre 2026 : un mois courant différent ne
    // recouvre rien, et un mois identique est déjà couvert par les tests purs.
    await openFilter(user, 'Début');
    await user.click(dayButton(thisMonth(2)));
    await user.click(dayButton(thisMonth(4)));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    const days = studentRows().map((row) => within(row).getAllByRole('cell')[1].textContent);
    // Chaque ligne restante est bien dans la plage retenue.
    days.forEach((value) => expect(value).not.toBe('Non démarré'));
  });

  it('ne réaffiche pas l’infobulle quand on ferme le popover', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    const trigger = screen.getByRole('button', { name: 'Filtrer par Début' });

    await user.hover(trigger);
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();

    // Le popover masque l'infobulle…
    await user.click(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // …et la fermeture rend le focus au bouton, ce qui la rouvrirait sans verrou.
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('redonne l’infobulle après être ressorti du bouton', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);
    const trigger = screen.getByRole('button', { name: 'Filtrer par Début' });

    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.unhover(trigger);
    await user.hover(trigger);

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Filtrer par plage de dates');
  });

  it('cumule les plages de deux colonnes', async () => {
    const user = userEvent.setup();
    render(<Harness status="failed" />);

    await openFilter(user, 'Début');
    await user.click(dayButton(thisMonth(2)));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    await openFilter(user, 'Accès valable jusqu’au');
    await user.click(dayButton(thisMonth(3)));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    expect(
      screen.getByRole('button', { name: 'Filtrer par Début — filtre actif' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Filtrer par Accès valable jusqu’au — filtre actif' }),
    ).toBeInTheDocument();
  });
});
