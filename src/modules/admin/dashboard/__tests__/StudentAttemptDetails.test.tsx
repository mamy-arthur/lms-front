import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentAttemptDetails } from '../components/StudentAttemptDetails';
import { getDemoStudentAttempts } from '../data/studentAttemptsDemo';
import {
  formationProgressDemo,
  getDemoFormationStudents,
  type DashboardEnrollmentStatus,
} from '../data/studentProgressDemo';

function getAttempts(status: DashboardEnrollmentStatus = 'completed') {
  const formation = formationProgressDemo[0];
  const student = getDemoFormationStudents(formation, status)[0];
  return getDemoStudentAttempts(formation, status, student.id);
}

describe('temps passé par cours dans une tentative', () => {
  it('déplie et replie le module au clavier en affichant ses temps par cours', async () => {
    const user = userEvent.setup();
    render(<StudentAttemptDetails attempt={getAttempts()[0]} />);
    const trigger = screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: /^Temps par cours/ })).not.toBeInTheDocument();

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('list', { name: 'Temps par cours de Module 1 — tentative 1' });
    const courses = within(list).getAllByRole('listitem');
    expect(courses).toHaveLength(3);
    expect(courses[0]).toHaveTextContent('Cours 1 — Introduction');
    expect(courses[0]).toHaveTextContent('45 min');
    expect(courses[1]).toHaveTextContent('1 h');
    expect(courses[2]).toHaveTextContent('1 h 15 min');
    expect(screen.getByText('Temps passé : 3 h')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('list', { name: /^Temps par cours/ })).not.toBeInTheDocument();
  });

  it('n’ouvre pas les modules verrouillés et ne transforme pas les évaluations en boutons', async () => {
    const user = userEvent.setup();
    render(<StudentAttemptDetails attempt={getAttempts()[0]} />);
    const trigger = screen.getByRole('button', { name: 'Voir le temps par cours de Module 2' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('list', { name: /Temps par cours de Module 2/ }),
    ).not.toBeInTheDocument();
    expect(trigger.closest('li')).toHaveTextContent('Échec à l’évaluation 1');
    expect(screen.queryByRole('button', { name: /Évaluation/ })).not.toBeInTheDocument();
  });

  it('montre le temps déjà passé et zéro pour un cours non commencé', async () => {
    const user = userEvent.setup();
    render(<StudentAttemptDetails attempt={getAttempts('in_progress')[1]} />);
    await user.click(screen.getByRole('button', { name: 'Voir le temps par cours de Module 2' }));
    const courses = within(
      screen.getByRole('list', {
        name: 'Temps par cours de Module 2 — tentative 2',
      }),
    ).getAllByRole('listitem');
    expect(courses[0]).toHaveTextContent('20 min');
    expect(courses[0]).toHaveTextContent('Terminé');
    expect(courses[1]).toHaveTextContent('15 min');
    expect(courses[1]).toHaveTextContent('En cours');
    expect(courses[2]).toHaveTextContent('0 min');
    expect(courses[2]).toHaveTextContent('Non commencé');
    expect(screen.getByText('Temps passé : 35 min')).toBeInTheDocument();
  });

  it('isole les durées et réinitialise les modules ouverts entre deux tentatives', async () => {
    const user = userEvent.setup();
    const attempts = getAttempts();
    const { rerender } = render(<StudentAttemptDetails attempt={attempts[0]} />);
    await user.click(screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' }));
    rerender(<StudentAttemptDetails attempt={attempts[1]} />);
    const trigger = screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const courses = within(
      screen.getByRole('list', {
        name: 'Temps par cours de Module 1 — tentative 2',
      }),
    ).getAllByRole('listitem');
    expect(courses[0]).toHaveTextContent('1 h');
    expect(courses[1]).toHaveTextContent('1 h 20 min');
    expect(courses[2]).toHaveTextContent('1 h 40 min');
    expect(screen.getByText('Temps passé : 4 h')).toBeInTheDocument();
  });

  it('permet de consulter plusieurs modules sans refermer la tentative', async () => {
    const user = userEvent.setup();
    render(<StudentAttemptDetails attempt={getAttempts()[1]} />);
    await user.click(screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' }));
    await user.click(screen.getByRole('button', { name: 'Voir le temps par cours de Module 2' }));
    expect(screen.getAllByRole('list', { name: /^Temps par cours/ })).toHaveLength(2);
  });

  it('affiche un message lorsque le détail par cours n’est pas disponible', async () => {
    const user = userEvent.setup();
    const attempt = getAttempts()[0];
    const step = attempt.steps[0];
    if (step.kind === 'module') step.courses = [];
    render(<StudentAttemptDetails attempt={attempt} />);
    await user.click(screen.getByRole('button', { name: 'Voir le temps par cours de Module 1' }));
    expect(
      screen.getByText('Aucun détail par cours disponible pour ce module.'),
    ).toBeInTheDocument();
  });
});
