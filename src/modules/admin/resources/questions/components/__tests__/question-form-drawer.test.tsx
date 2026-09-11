import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminModulesApi } from '@/modules/admin/resources/modules/api';
import { quizItemsApi } from '@/shared/api/question-banks.api';
import type { ApiQuizItem } from '@/shared/types/question-bank.types';
import { normalizeQuestion } from '../../types';
import { QuestionFormDrawer } from '../question-form-drawer';

jest.mock('@/modules/admin/resources/modules/api', () => ({
  adminModulesApi: { list: jest.fn(), getById: jest.fn() },
}));

jest.mock('@/shared/api/question-banks.api', () => ({
  questionBanksApi: { createQuizItem: jest.fn() },
  quizItemsApi: { update: jest.fn() },
}));

const MODULE_A = { id: 'module-a', shortname: 'Sécurité au travail' };
const MODULE_B = { id: 'module-b', shortname: 'Premiers secours' };
const API_QUESTION: ApiQuizItem = {
  id: 'question-1',
  question_bank_id: 'bank-1',
  type: 'true_false',
  question: 'Faut-il porter un casque ?',
  competency_id: MODULE_A.id,
  correct_answer: true,
  idnumber: 'Q-1',
  comment_if_correct: null,
  comment_if_incorrect: null,
  created_at: '2026-09-09T00:00:00Z',
  updated_at: '2026-09-09T00:00:00Z',
};
const QUESTION = normalizeQuestion(API_QUESTION);

async function expectSelectedModule(name: string) {
  const picker = await screen.findByRole('combobox');
  await waitFor(() => expect(picker).toHaveTextContent(name));
  return picker;
}

function renderDrawer() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = jest.fn();
  const view = render(
    <QueryClientProvider client={client}>
      <QuestionFormDrawer open={false} onClose={onClose} />
    </QueryClientProvider>,
  );
  return {
    open: (question = QUESTION) =>
      view.rerender(
        <QueryClientProvider client={client}>
          <QuestionFormDrawer open onClose={onClose} question={question} />
        </QueryClientProvider>,
      ),
    close: () =>
      view.rerender(
        <QueryClientProvider client={client}>
          <QuestionFormDrawer open={false} onClose={onClose} />
        </QueryClientProvider>,
      ),
  };
}

describe('QuestionFormDrawer — module sélectionné', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(adminModulesApi.getById).mockImplementation(async (id) => ({
      data: id === MODULE_A.id ? MODULE_A : MODULE_B,
    }));
    jest.mocked(adminModulesApi.list).mockResolvedValue({ data: [MODULE_A, MODULE_B] });
    jest.mocked(quizItemsApi.update).mockResolvedValue(API_QUESTION);
  });

  it('affiche le module enregistré à l’ouverture et le conserve à l’enregistrement', async () => {
    const user = userEvent.setup();
    const drawer = renderDrawer();
    drawer.open();

    await expectSelectedModule(MODULE_A.shortname);
    expect(adminModulesApi.getById).toHaveBeenCalledWith(MODULE_A.id);
    expect(adminModulesApi.list).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(quizItemsApi.update).toHaveBeenCalledWith(
        QUESTION.id,
        expect.objectContaining({ competency_id: MODULE_A.id }),
      ),
    );
  });

  it('affiche un autre module choisi et enregistre cette nouvelle association', async () => {
    const user = userEvent.setup();
    const drawer = renderDrawer();
    drawer.open();

    await user.click(await expectSelectedModule(MODULE_A.shortname));
    await user.click(await screen.findByRole('button', { name: MODULE_B.shortname }));
    await expectSelectedModule(MODULE_B.shortname);
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(quizItemsApi.update).toHaveBeenCalledWith(
        QUESTION.id,
        expect.objectContaining({ competency_id: MODULE_B.id }),
      ),
    );
  });

  it('restaure le module de chaque question après fermeture et réouverture', async () => {
    const user = userEvent.setup();
    const drawer = renderDrawer();
    drawer.open();
    await expectSelectedModule(MODULE_A.shortname);
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    drawer.close();
    drawer.open({ ...QUESTION, id: 'question-2', competencyId: MODULE_B.id });
    await expectSelectedModule(MODULE_B.shortname);
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    drawer.close();
    drawer.open();
    await expectSelectedModule(MODULE_A.shortname);
  });

  it.each([
    ['pixels', WheelEvent.DOM_DELTA_PIXEL, 2],
    ['lignes', WheelEvent.DOM_DELTA_LINE, 40],
    ['pages', WheelEvent.DOM_DELTA_PAGE, 480],
  ])(
    'défile en %s sans scroll natif supplémentaire, même après réouverture',
    async (_, deltaMode, delta) => {
      const user = userEvent.setup();
      const drawer = renderDrawer();
      drawer.open();

      for (let opening = 0; opening < 2; opening++) {
        await user.click(await expectSelectedModule(MODULE_A.shortname));
        const moduleButton = await screen.findByRole('button', { name: MODULE_A.shortname });
        const list = moduleButton.parentElement!;
        // jsdom has no layout engine: provide the rendered list's scroll metrics.
        Object.defineProperty(list, 'clientHeight', { configurable: true, value: 240 });
        Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 2000 });
        list.style.lineHeight = '20px';
        list.scrollTop = 600;

        for (const direction of [1, -1]) {
          const before = list.scrollTop;
          const event = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            deltaY: direction * 2,
            deltaMode,
          });
          fireEvent(moduleButton, event);
          expect(event.defaultPrevented).toBe(true);
          expect(list.scrollTop).toBe(before + direction * delta);
        }

        await user.click(moduleButton);
      }
    },
  );
});
