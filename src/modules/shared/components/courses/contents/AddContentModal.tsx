import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContentTypePicker } from './ContentTypePicker';
import { ContentType } from '../types';
import { useCourseStore } from '../hooks/useCouseContentStore';

export function AddContentModal({
  open,
  onOpenChange,
  sectionId,
  setType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  setType: (type: ContentType) => void;
}) {
  const cours = useCourseStore();
  const handleSelect = (type: ContentType) => {
    setType(type);
    cours.addContent(sectionId, type, '');
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
