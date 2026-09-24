import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FormationStudentsSheet,
  type FormationStudentSelection,
} from '../components/FormationStudentsSheet';
import { FormationProgressCards } from '../components/FormationProgressCards';
import {
  formationProgressDemo,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
} from '../data/studentProgressDemo';
import {
  formatAttemptDate,
  formatAttemptDuration,
  getAttemptMinutes,
  getDemoEnrollmentSummary,
  getDemoStudentAttempts,
} from '../data/studentAttemptsDemo';

const formation = formationProgressDemo[0];

/** Lignes d'étudiants : en-tête et ligne d'état vide (une seule cellule) exclus. */
function studentRows() {
  const [, body] = within(screen.getByRole('table', { name: 'Étudiants concernés' })).getAllByRole(
    'rowgroup',
  );
  return within(body)
    .getAllByRole('row')
    .filter((row) => within(row).queryAllByRole('cell').length === 7);
}

/** Le volet de détail n'est monté que lorsqu'une ligne est sélectionnée. */
function detailPane() {
  return screen.queryByRole('region', { name: /^Tentatives de/ });
}

function Harness({ status = 'failed' }: { status?: DashboardEnrollmentStatus }) {
  const [selection, setSelection] = useState<FormationStudentSelection | null>({
    formation,
    status,
  });
  return (
    <>
      <button onClick={() => setSelection({ formation, status })}>Ouvrir le panneau</button>
      <FormationStudentsSheet
        selection={selection}
        onClose={() => setSelection(null)}
        onRestoreFocus={() => {}}
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
    ).toHaveLength(7);
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
    ).toEqual(['Étudiant', 'Début', 'Fin', 'Temps passé', 'Tentatives', 'Échéance', 'Statut']);
  });

  it('range dates, temps passé, tentatives et échéance dans les colonnes', () => {
    render(<Harness status="failed" />);

    studentRows().forEach((row, index) => {
      const student = getDemoFormationStudents(formation, 'failed')[index];
      const summary = getDemoEnrollmentSummary(formation, 'failed', student.id);
      const cells = within(row).getAllByRole('cell');
      expect(cells).toHaveLength(7);
      expect(cells[0]).toHaveTextContent(student.name);
      expect(cells[0]).toHaveTextContent(student.email);
      expect(cells[1]).toHaveTextContent(formatAttemptDate(summary.startedAt!));
      expect(cells[2]).toHaveTextContent(formatAttemptDate(summary.endedAt!));
      expect(cells[3]).toHaveTextContent(formatAttemptDuration(summary.minutes));
      expect(cells[4]).toHaveTextContent(String(summary.attempts));
      expect(cells[5]).toHaveTextContent(formatAttemptDate(summary.dueAt));
      expect(cells[6]).toHaveTextContent(/Dans les temps|En retard|Terminé en retard/);
    });
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
        selection={{ formation: { ...formation, failed: 0 }, status: 'failed' }}
        onClose={() => {}}
        onRestoreFocus={() => {}}
      />,
    );
    expect(screen.getByText('Aucun étudiant dans ce statut.')).toBeInTheDocument();
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
    render(<FormationProgressCards />);
    const badge = screen.getByRole('button', { name: `Échouées : 2 — ${formation.name}` });
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
