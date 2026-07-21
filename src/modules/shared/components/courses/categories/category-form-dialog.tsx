import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryForm } from './category-form';
import type { Category } from '../types/index';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  defaultParentId?: string | null;
};

export function CategoryFormDialog({ open, onOpenChange, category, defaultParentId }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col p-0 sm:max-w-lg overflow-hidden">
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
          <DialogDescription>
            {category
              ? 'Modifiez les informations de la catégorie.'
              : 'Créez une nouvelle catégorie pour organiser vos cours.'}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          category={category}
          defaultParentId={defaultParentId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
