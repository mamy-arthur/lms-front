import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContentTypePicker } from './ContentTypePicker';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the user picks a ContentType.
   * No API call is made here — the parent is responsible for creating the entry
   * only when the user explicitly clicks "Enregistrer" in the edit panel.
   */
  onContentTypeSelected: (ct: ContentTypeResource) => void;
}

export function AddContentModal({ open, onOpenChange, onContentTypeSelected }: Props) {
  const handleSelect = (ct: ContentTypeResource) => {
    onContentTypeSelected(ct);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
