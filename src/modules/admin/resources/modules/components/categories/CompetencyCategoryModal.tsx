'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CompetencyCategory } from '../../types';
import { CompetencyCategoryForm } from './CompetencyCategoryForm';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CompetencyCategory | null;
  onCreated?: (category: CompetencyCategory) => void;
};

export function CompetencyCategoryModal({ open, onOpenChange, category = null, onCreated }: Props) {
  const isEdit = !!category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de la catégorie.'
              : 'Créez une nouvelle catégorie de module.'}
          </DialogDescription>
        </DialogHeader>

        <CompetencyCategoryForm
          key={category?.id ?? 'create'}
          category={category}
          onCancel={() => onOpenChange(false)}
          onDone={(created) => {
            if (created) onCreated?.(created);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
