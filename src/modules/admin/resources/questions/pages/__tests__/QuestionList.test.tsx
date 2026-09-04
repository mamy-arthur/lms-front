/**
 * Tests fonctionnels — QuestionList
 *
 * Couvre le filtre multi-select "Modules" :
 *  - affichage des badges des modules sélectionnés
 *  - la liste des modules disponibles (moduleNameById) n'est pas réduite aux
 *    seuls modules déjà sélectionnés (pas d'auto-restriction côté frontend)
 *  - le retrait d'un badge appelle bien handleCompetencyToggle avec le bon id
 *  - le libellé du déclencheur du filtre reflète le nombre de sélections
 */

// ─── Polyfills ────────────────────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockHandleTypeToggle = jest.fn();
const mockHandleClearTypes = jest.fn();
const mockHandleCompetencyToggle = jest.fn();
const mockHandleClearCompetencies = jest.fn();

let mockControllerParams: { types?: string; competency_ids?: string } = {};

jest.mock('@/modules/shared/hooks/useQuestionListController', () => ({
  useQuestionListController: () => ({
    params: mockControllerParams,
    draftSearch: '',
    setDraftSearch: jest.fn(),
    handleSearch: jest.fn(),
    handleTypeToggle: mockHandleTypeToggle,
    handleClearTypes: mockHandleClearTypes,
    handleCompetencyToggle: mockHandleCompetencyToggle,
    handleClearCompetencies: mockHandleClearCompetencies,
    handleSort: jest.fn(),
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    handleOpenCreate: jest.fn(),
    handleCloseDrawer: jest.fn(),
    handleSuccess: jest.fn(),
    handleEdit: jest.fn(),
    isDrawerOpen: false,
    editingQuestion: undefined,
    page: 0,
    pageSize: 25,
    sort: { column: 'updated_at', direction: 'desc' },
    hasQuery: false,
  }),
}));

let mockQuestionsQueryReturn: {
  data?: { data: unknown[]; total: number; bankCompetencyIds: string[] };
  isLoading: boolean;
} = { data: undefined, isLoading: false };

jest.mock('../../hooks/useQuestionsQuery', () => ({
  useQuestionsQuery: () => mockQuestionsQueryReturn,
}));

let mockModulesQueryReturn: { data?: { data: unknown[]; total: number } } = { data: undefined };

jest.mock('@/modules/admin/resources/modules/hooks/useModules', () => ({
  useModules: () => mockModulesQueryReturn,
}));

jest.mock('../../hooks/useDeleteQuestion', () => ({
  useDeleteQuestion: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@modules/shared/components/quizzes', () => ({
  QuizSearch: () => <div data-testid="quiz-search" />,
}));

const mockTableProps = jest.fn();
jest.mock('../_components/admin-questions-table', () => ({
  AdminQuestionsTable: (props: object) => {
    mockTableProps(props);
    return <div data-testid="admin-questions-table" />;
  },
}));

jest.mock('../../components/question-form-drawer', () => ({
  QuestionFormDrawer: () => null,
}));

// ─── Imports ──────────────────────────────────────────────────────────────────
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionList } from '../QuestionList';
import type { Question } from '../../types';
import type { Module } from '@/modules/admin/resources/modules/types';


// ─── Fixtures ─────────────────────────────────────────────────────────────────
function makeModule(id: string, shortname: string): Module {
  return {
    id,
    shortname,
    idnumber: id.toUpperCase(),
    description: '',
    category_id: null,
    category_name: null,
    tenantId: '1',
    courseIds: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

const MODULE_A = makeModule('comp-1', 'Module A');
const MODULE_B = makeModule('comp-2', 'Module B');
const MODULE_C = makeModule('comp-3', 'Module C');

const QUESTIONS: Question[] = [];

function renderPage() {
  return render(<QuestionList quizId="bank-1" />);
}

function lastTableProps() {
  const calls = mockTableProps.mock.calls;
  return calls[calls.length - 1]?.[0] as {
    moduleNameById?: Map<string, string>;
    total: number;
  };
}

describe('QuestionList — filtre multi-select Modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockControllerParams = {};
    mockQuestionsQueryReturn = {
      data: { data: QUESTIONS, total: 0, bankCompetencyIds: ['comp-1', 'comp-2', 'comp-3'] },
      isLoading: false,
    };
    mockModulesQueryReturn = { data: { data: [MODULE_A, MODULE_B, MODULE_C], total: 3 } };
  });

  it('affiche "Tous les modules" quand aucun filtre n\'est actif', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /tous les modules/i })).toBeInTheDocument();
  });

  it('affiche le nombre de modules sélectionnés dans le déclencheur du filtre', () => {
    mockControllerParams = { competency_ids: 'comp-1,comp-2' };
    renderPage();
    expect(screen.getByRole('button', { name: /2 modules/i })).toBeInTheDocument();
  });

  it('affiche un badge par module sélectionné, avec son nom résolu', () => {
    mockControllerParams = { competency_ids: 'comp-1,comp-2' };
    renderPage();

    expect(screen.getByText('Module A')).toBeInTheDocument();
    expect(screen.getByText('Module B')).toBeInTheDocument();
    expect(screen.queryByText('Module C')).not.toBeInTheDocument();
  });

  it("ne restreint pas la liste des modules disponibles aux seuls modules déjà sélectionnés", () => {
    // Un seul module est sélectionné, mais la banque contient 3 modules distincts.
    mockControllerParams = { competency_ids: 'comp-1' };
    renderPage();

    const { moduleNameById } = lastTableProps();
    expect(moduleNameById?.size).toBe(3);
    expect(moduleNameById?.get('comp-1')).toBe('Module A');
    expect(moduleNameById?.get('comp-2')).toBe('Module B');
    expect(moduleNameById?.get('comp-3')).toBe('Module C');
  });

  it('le retrait du badge appelle handleCompetencyToggle avec le bon id', async () => {
    mockControllerParams = { competency_ids: 'comp-1,comp-2' };
    renderPage();

    const removeButtons = screen.getAllByRole('button', { name: /retirer ce filtre/i });
    await userEvent.click(removeButtons[0]);

    expect(mockHandleCompetencyToggle).toHaveBeenCalledWith('comp-1');
  });

  it('transmet le total de la requête à la table', () => {
    mockQuestionsQueryReturn = {
      data: { data: QUESTIONS, total: 42, bankCompetencyIds: [] },
      isLoading: false,
    };
    renderPage();

    expect(lastTableProps().total).toBe(42);
  });
});
