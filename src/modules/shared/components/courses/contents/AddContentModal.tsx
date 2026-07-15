import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContentTypePicker } from './ContentTypePicker';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import { useCourseStore } from '../hooks/useCouseContentStore';

export function AddContentModal({
  open,
  onOpenChange,
  sectionId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onSelect: (contentType: ContentTypeResource) => void;
}) {
  const cours = useCourseStore();
  const handleSelect = (ct: ContentTypeResource) => {
    cours.addContent(sectionId, ct.module_type, '', undefined, ct);
    onSelect(ct);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Choisir un type de contenu</DialogTitle>
          <DialogDescription>
            Sélectionnez le type de ressource à ajouter à cette section.
          </DialogDescription>
        </DialogHeader>
        <ContentTypePicker onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}
