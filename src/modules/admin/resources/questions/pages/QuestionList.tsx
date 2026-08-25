'use client';

import { ChevronDown, Plus, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { QuizSearch } from '@modules/shared/components/quizzes';
import { QUESTION_TYPE_OPTIONS } from '@modules/shared/components/questions';
import { useQuestionListController } from '@/modules/shared/hooks/useQuestionListController';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useDeleteQuestion } from '../hooks/useDeleteQuestion';
import { useModules } from '@/modules/admin/resources/modules/hooks/useModules';
import type { Question } from '../types';
import { AdminQuestionsTable } from './_components/admin-questions-table';
import { QuestionFormDrawer } from '../components/question-form-drawer';

export function QuestionList({ quizId }: { quizId: string }) {
  const ctrl = useQuestionListController<Question>({
    defaultPageSize: 25,
  });
  const { data, isLoading } = useQuestionsQuery(quizId, ctrl.params);
  const { data: modulesData } = useModules({ page_size: 100 });
  const deleteMutation = useDeleteQuestion(quizId);
  const [deleteConfirm, setDeleteConfirm] = useState<Question | undefined>();

  const questions = data?.data ?? [];
  const modules = useMemo(() => {
    const ids = new Set(data?.bankCompetencyIds ?? []);
    return (modulesData?.data ?? []).filter((m) => ids.has(m.id));
  }, [modulesData?.data, data?.bankCompetencyIds]);

  const moduleNameById = useMemo(
    () => new Map(modules.map((m) => [m.id, m.shortname])),
    [modules],
  );

  const selectedTypes = useMemo(
    () => (ctrl.params.types ? ctrl.params.types.split(',') : []),
    [ctrl.params.types],
  );

  const selectedCompetencyIds = useMemo(
    () => (ctrl.params.competency_ids ? ctrl.params.competency_ids.split(',') : []),
    [ctrl.params.competency_ids],
  );

  const handleDeleteConfirm = useCallback((question: Question) => setDeleteConfirm(question), []);

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Banque : <span className="font-mono text-xs font-medium">{quizId}</span>
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <QuizSearch
            value={ctrl.draftSearch}
            onChange={ctrl.setDraftSearch}
            onSearch={ctrl.handleSearch}
          />
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Type multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between text-xs font-normal">
                  {selectedTypes.length === 0
                    ? 'Tous les types'
                    : `${selectedTypes.length} type${selectedTypes.length > 1 ? 's' : ''}`}
                  <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2" align="end">
                <div className="space-y-0.5">
                  {QUESTION_TYPE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs">
                      <Checkbox
                        checked={selectedTypes.includes(opt.value)}
                        onCheckedChange={() => ctrl.handleTypeToggle(opt.value)}
                        className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"

                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {selectedTypes.length > 0 && (
                  <button
                    className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => selectedTypes.forEach((t) => ctrl.handleTypeToggle(t))}
                  >
                    Effacer
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Module multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between text-xs font-normal">
                  {selectedCompetencyIds.length === 0
                    ? 'Tous les modules'
                    : `${selectedCompetencyIds.length} module${selectedCompetencyIds.length > 1 ? 's' : ''}`}
                  <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {modules.map((m) => (
                    <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs">
                      <Checkbox
                        checked={selectedCompetencyIds.includes(m.id)}
                        onCheckedChange={() => ctrl.handleCompetencyToggle(m.id)}
                        className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"

                      />
                      {m.shortname}
                    </label>
                  ))}
                  {modules.length === 0 && (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">Aucun module</p>
                  )}
                </div>
                {selectedCompetencyIds.length > 0 && (
                  <button
                    className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => selectedCompetencyIds.forEach((id) => ctrl.handleCompetencyToggle(id))}
                  >
                    Effacer
                  </button>
                )}
              </PopoverContent>
            </Popover>

            <Button
              onClick={ctrl.handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouvelle question
            </Button>
          </div>
        </div>

        {selectedCompetencyIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCompetencyIds.map((id) => (
              <Badge key={id} variant="outline" className="h-6 gap-1 px-2 text-xs font-normal bg-(--color-primary) text-white">
                {moduleNameById.get(id) ?? id}
                <button
                  onClick={() => ctrl.handleCompetencyToggle(id)}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                  aria-label="Retirer ce filtre"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <AdminQuestionsTable
          questions={questions}
          moduleNameById={moduleNameById}
          isLoading={isLoading}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={data?.total ?? 0}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
          onEdit={ctrl.handleEdit}
          onDelete={handleDeleteConfirm}
        />
      </div>

      <QuestionFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        question={ctrl.editingQuestion}
        defaultQuizId={quizId}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer la question"
        description={
          <>Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.</>
        }
        confirmClassName="bg-destructive hover:bg-destructive/80"
        onClose={() => setDeleteConfirm(undefined)}
        onConfirm={() => {
          if (deleteConfirm) deleteMutation.mutate(deleteConfirm.id);
          setDeleteConfirm(undefined);
        }}
      />
    </div>
  );
}
