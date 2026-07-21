import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CategoryTable } from './category-table';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryDrawer({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-3xl">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Gérer les catégories</SheetTitle>
          <SheetDescription>
            Organisez vos cours avec une arborescence de catégories.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <CategoryTable />
        </div>
      </SheetContent>
    </Sheet>
  );
}
