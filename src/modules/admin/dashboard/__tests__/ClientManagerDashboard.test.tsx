import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientManagerDashboard } from '../ClientManagerDashboard';
import { FormationProgressCards } from '../components/FormationProgressCards';
import { FormationCatalogOverview } from '../components/FormationCatalogOverview';
import { StudentProgressOverview } from '../components/StudentProgressOverview';
import {
  demoProgress,
  enrollmentStatuses,
  formationProgressDemo,
  getCompletionRate,
  getDemoFormationStudents,
  getEnrollmentCount,
} from '../data/studentProgressDemo';

function formationSection() {
  return screen.getByRole('region', { name: 'Suivi des étudiants par formation' });
}

function visibleNames() {
  return within(formationSection())
    .getAllByRole('heading', { level: 3 })
    .map((item) => item.textContent);
}

describe('ClientManagerDashboard', () => {
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterAll(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('présente une seule mention de démonstration, sans ventes ni temps moyen', async () => {
    render(<ClientManagerDashboard />);

    expect(screen.getByText('120 étudiants · 180 inscriptions')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('progressbar', { name: 'Progression moyenne des étudiants' }),
      ).toHaveAttribute('aria-valuenow', '64'),
    );
    expect(screen.getByRole('link', { name: 'Gérer les formations' })).toHaveAttribute(
      'href',
      '/admin/programs',
    );
    expect(screen.queryByText(/chiffre d.affaires|temps moyen passé/i)).not.toBeInTheDocument();
  });

  it('affiche la progression moyenne avec le composant Progress accessible', async () => {
    render(<StudentProgressOverview />);

    const progress = screen.getByRole('progressbar', { name: 'Progression moyenne des étudiants' });
    expect(progress).toHaveAttribute('data-slot', 'progress');
    await waitFor(() =>
      expect(progress).toHaveAttribute('aria-valuenow', String(demoProgress.averageProgress)),
    );
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress.querySelector('[data-slot="progress-indicator"]')).toHaveStyle({
      transform: `translateX(-${100 - demoProgress.averageProgress}%)`,
    });
  });

  it('affiche le catalogue avant la progression avec des totaux cohérents', () => {
    render(<ClientManagerDashboard />);
    const catalogue = screen.getByRole('region', { name: 'Catalogue des formations' });
    expect(
      within(catalogue)
        .getAllByRole('term')
        .map((item) => item.textContent),
    ).toEqual(['Total des formations', 'Publiées', 'Non publiées']);
    const counts = within(catalogue)
      .getAllByRole('definition')
      .map((item) => Number(item.textContent));
    expect(counts).toEqual([4, 3, 1]);
    expect(counts[0]).toBe(counts[1] + counts[2]);
    const progress = screen.getByRole('heading', { name: 'Progression globale des étudiants' });
    expect(
      catalogue.compareDocumentPosition(progress) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it.each([
    { label: 'vide', formations: [], expected: ['0', '0', '0'] },
    { label: 'entièrement publié', formations: [{ isPublished: true }], expected: ['1', '1', '0'] },
    { label: 'non publié', formations: [{ isPublished: false }], expected: ['1', '0', '1'] },
  ])('calcule les compteurs pour un catalogue $label', ({ formations, expected }) => {
    render(<FormationCatalogOverview formations={formations} />);
    expect(screen.getAllByRole('definition').map((item) => item.textContent)).toEqual(expected);
  });

  it('affiche les quatre statuts et le taux de complétion par formation', async () => {
    render(<ClientManagerDashboard />);
    const cards = within(formationSection()).getAllByRole('listitem');
    expect(cards).toHaveLength(4);

    for (const [index, card] of cards.entries()) {
      const formation = formationProgressDemo[index];
      expect(within(card).getByRole('heading', { name: formation.name })).toBeInTheDocument();
      expect(within(card).getByRole('definition')).toHaveTextContent(
        String(getEnrollmentCount(formation)),
      );
      expect(within(card).getAllByRole('button')).toHaveLength(4);
      enrollmentStatuses.forEach((status) => {
        expect(
          within(card).getByRole('button', {
            name: `${status.label} : ${formation[status.key]} — ${formation.name}`,
          }),
        ).toHaveTextContent(String(formation[status.key]));
      });
      const completionRate = Math.round(getCompletionRate(formation));
      const progress = within(card).getByRole('progressbar', {
        name: `Taux de complétion de ${formation.name}`,
      });
      expect(progress).toHaveAttribute('data-slot', 'progress');
      await waitFor(() =>
        expect(progress).toHaveAttribute('aria-valuenow', String(completionRate)),
      );
      expect(progress).toHaveAttribute(
        'aria-valuetext',
        `${completionRate} % des inscrits ont terminé avec succès`,
      );
      expect(progress.querySelector('[data-slot="progress-indicator"]')).toHaveStyle({
        transform: `translateX(-${100 - completionRate}%)`,
      });
    }
  });

  it('utilise les mêmes couleurs de statut dans la synthèse et les badges', () => {
    render(<ClientManagerDashboard />);
    const overview = screen
      .getByRole('heading', { name: 'Progression globale des étudiants' })
      .closest<HTMLElement>('[data-slot="card"]')!;
    expect(enrollmentStatuses.map((status) => status.color)).toEqual([
      'bg-emerald-500',
      'bg-amber-500',
      'bg-slate-400',
      'bg-red-500',
    ]);
    enrollmentStatuses.forEach((status) => {
      const term = within(overview).getByText(status.label);
      expect(term.querySelector('[aria-hidden="true"]')).toHaveClass(status.color);
      expect(
        within(formationSection()).getAllByRole('button', {
          name: new RegExp(`^${status.label} :`),
        })[0],
      ).toHaveClass(...status.badgeClassName.split(' '));
    });
  });

  it('recherche sans tenir compte des accents, de la casse et des espaces', async () => {
    const user = userEvent.setup();
    render(<ClientManagerDashboard />);
    await user.type(screen.getByRole('searchbox'), '  PREVENIR  ');

    expect(visibleNames()).toEqual(['Prévenir les risques professionnels']);
    expect(screen.getByRole('status')).toHaveTextContent('1 sur 4 formations');
    expect(screen.getByText('120 étudiants · 180 inscriptions')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Catalogue des formations' }))
        .getAllByRole('definition')
        .map((item) => item.textContent),
    ).toEqual(['4', '3', '1']);
  });

  it('affiche un état sans résultats et permet de réinitialiser la recherche', async () => {
    const user = userEvent.setup();
    render(<ClientManagerDashboard />);
    await user.type(screen.getByRole('searchbox'), 'Introuvable');
    expect(
      screen.getByText('Aucune formation ne correspond à votre recherche.'),
    ).toBeInTheDocument();
    expect(within(formationSection()).queryByRole('listitem')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(visibleNames()).toHaveLength(4);
  });

  it.each([
    ['Moins de complétion', [3, 1, 2, 0]],
    ['Plus d’échecs', [3, 1, 0, 2]],
    ['Plus d’inscrits', [0, 1, 2, 3]],
  ])('trie les formations : %s', async (label, order) => {
    const user = userEvent.setup();
    render(<ClientManagerDashboard />);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Trier les formations' }), {
      key: 'ArrowDown',
    });
    await user.click(await screen.findByRole('option', { name: label }));
    expect(visibleNames()).toEqual(order.map((index) => formationProgressDemo[index].name));
    expect(formationProgressDemo.map((formation) => formation.id)).toEqual([
      'demo-1',
      'demo-2',
      'demo-3',
      'demo-4',
    ]);
  });

  it.each(enrollmentStatuses)(
    'ouvre les étudiants du statut $key et restaure le focus',
    async (status) => {
      const user = userEvent.setup();
      render(<ClientManagerDashboard />);
      const formation = formationProgressDemo[0];
      const trigger = screen.getByRole('button', {
        name: `${status.label} : ${formation[status.key]} — ${formation.name}`,
      });
      trigger.focus();
      await user.keyboard('{Enter}');
      // Le panneau charge tout l'effectif, mais s'ouvre filtré sur le badge cliqué.
      const dialog = await screen.findByRole('dialog', { name: formation.name });
      const [, body] = within(
        within(dialog).getByRole('table', { name: 'Étudiants concernés' }),
      ).getAllByRole('rowgroup');
      const rows = within(body).getAllByRole('row');
      const students = getDemoFormationStudents(formation, status.key);
      expect(rows).toHaveLength(formation[status.key]);
      rows.forEach((row, index) => {
        expect(within(row).getByText(students[index].name)).toBeInTheDocument();
        expect(within(row).getByText(students[index].email)).toBeInTheDocument();
        expect(row.querySelector('[data-slot="avatar"]')).toHaveAttribute('aria-hidden', 'true');
        expect(row.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument();
      });
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    },
  );

  it('gère une formation sans inscriptions sans division par zéro', () => {
    render(
      <FormationProgressCards
        formations={[
          {
            id: 'empty',
            name: 'Formation vide',
            isPublished: false,
            theoreticalMinutes: 60,
            expiresAt: '2026-12-31T23:59:59.000Z',
            completionCriterion: 'Évaluation finale réussie',
            completed: 0,
            in_progress: 0,
            not_started: 0,
            failed: 0,
          },
        ]}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    within(formationSection())
      .getAllByRole('button')
      .forEach((button) => expect(button).toBeDisabled());
  });

  it('affiche un état vide lorsque le catalogue ne contient aucune formation', () => {
    render(<FormationProgressCards formations={[]} />);
    expect(screen.getByText('Aucune formation à afficher.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 sur 0 formations');
  });

  it('conserve des effectifs cohérents entre les listes étudiantes, les cartes et la synthèse', () => {
    const studentIds = new Set<string>();
    const studentEmails = new Map<string, string>();
    const totals = enrollmentStatuses.map((status) => {
      return formationProgressDemo.reduce((total, formation) => {
        const students = getDemoFormationStudents(formation, status.key);
        expect(students).toHaveLength(formation[status.key]);
        expect(new Set(students.map((student) => student.id)).size).toBe(students.length);
        students.forEach((student) => {
          studentIds.add(student.id);
          expect(student.email).toMatch(/^etudiant\.\d{3}@example\.com$/);
          if (studentEmails.has(student.id)) {
            expect(student.email).toBe(studentEmails.get(student.id));
          }
          studentEmails.set(student.id, student.email);
        });
        return total + students.length;
      }, 0);
    });
    expect(totals).toEqual([72, 81, 18, 9]);
    expect(totals).toEqual(demoProgress.enrollments.map((status) => status.count));
    expect(studentIds.size).toBe(demoProgress.students);
    expect(new Set(studentEmails.values()).size).toBe(demoProgress.students);
  });
});
