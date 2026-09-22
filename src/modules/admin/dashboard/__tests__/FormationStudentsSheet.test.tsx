import { useRef, useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FormationStudentsSheet,
  type FormationStudentSelection,
} from '../components/FormationStudentsSheet';
import {
  formationProgressDemo,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
} from '../data/studentProgressDemo';

const formation = formationProgressDemo[0];

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

async function selectFirstStudent(status: DashboardEnrollmentStatus = 'failed') {
  const user = userEvent.setup();
  render(<Harness status={status} />);
  const student = getDemoFormationStudents(formation, status)[0];
  const button = screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` });
  expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'true');
  expect(button).toHaveAttribute('aria-pressed', 'true');
  return { user, student, button };
}

describe('panneau des tentatives étudiantes', () => {
  it('ouvre par défaut le premier étudiant et présente ses tentatives sans les déplier', async () => {
    const { student } = await selectFirstStudent();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByRole('dialog')).toHaveClass('data-[side=right]:sm:max-w-7xl');
    const heading = screen.getByRole('heading', { name: `Tentatives de ${student.name}` });
    expect(heading).toHaveFocus();
    const history = screen.getByRole('region', { name: `Tentatives de ${student.name}` });
    expect(within(history).getByText(student.email)).toBeInTheDocument();
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

  it('reste compact lorsque la liste ne contient aucun étudiant', () => {
    render(
      <FormationStudentsSheet
        selection={{ formation: { ...formation, failed: 0 }, status: 'failed' }}
        onClose={() => {}}
        onRestoreFocus={() => {}}
      />,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'false');
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
    expect(screen.getByRole('heading', { name: `Tentatives de ${next.name}` })).toHaveFocus();
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

  it('réouvre le panneau sur le premier étudiant sans conserver la sélection précédente', async () => {
    const { user, student } = await selectFirstStudent();
    const next = getDemoFormationStudents(formation, 'failed')[1];
    await user.click(screen.getByRole('button', { name: `Voir les tentatives de ${next.name}` }));
    await user.click(screen.getByRole('button', { name: /^Tentative 1/ }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Ouvrir le panneau' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByRole('heading', { name: `Tentatives de ${student.name}` })).toHaveFocus();
    expect(
      screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Tentative 1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('sélectionne le premier étudiant du nouveau groupe lorsque le filtre change', () => {
    const props = { onClose: () => {}, onRestoreFocus: () => {} };
    const { rerender } = render(
      <FormationStudentsSheet {...props} selection={{ formation, status: 'failed' }} />,
    );
    rerender(<FormationStudentsSheet {...props} selection={{ formation, status: 'completed' }} />);
    const student = getDemoFormationStudents(formation, 'completed')[0];
    expect(
      screen.getByRole('heading', { name: `Tentatives de ${student.name}` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Voir les tentatives de ${student.name}` }),
    ).toHaveAttribute('aria-pressed', 'true');
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
