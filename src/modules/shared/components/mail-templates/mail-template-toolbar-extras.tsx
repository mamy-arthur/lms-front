"use client";

import { ImagePlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageInsertDialog } from "@modules/shared/components/tiptap/ImageInsertDialog";

/** Variables disponibles pour l'insertion dans un template mail. */
const MAIL_VARIABLES: { value: string; label: string }[] = [
  { value: "trainee_full_name", label: "Nom complet du stagiaire" },
  { value: "trainee_email", label: "Email du stagiaire" },
  { value: "course_name", label: "Nom de la formation" },
  { value: "completion_date", label: "Date de complétion" },
  { value: "tenant_name", label: "Nom du tenant" },
  { value: "reset_password_link", label: "Lien de réinitialisation" },
  { value: "login_link", label: "Lien de connexion" },
  { value: "issue_date", label: "Date d'émission" },
];

function MailTemplateToolbarExtrasComponent({ editor }: { editor: Editor }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`{{${variable}}}`).run();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Insérer une image"
        title="Insérer une image"
        onClick={() => setDialogOpen(true)}
        className="size-8"
      >
        <ImagePlus className="size-4" />
      </Button>

      <ImageInsertDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={({ src, alt, width, height, align }) => {
          (editor.chain().focus() as any)
            .setImage({ src, alt, width, height, align })
            .run();
        }}
      />

      <Select onValueChange={insertVariable}>
        <SelectTrigger
          className="h-8 w-36 text-xs"
          aria-label="Insérer une variable"
        >
          <SelectValue placeholder="Variable…" />
        </SelectTrigger>
        <SelectContent>
          {MAIL_VARIABLES.map((v) => (
            <SelectItem key={v.value} value={v.value} className="text-xs">
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

/**
 * Boutons de toolbar optionnels pour les templates mail.
 * Passer cette fonction comme `toolbarExtras` prop du RichTextEditor.
 */
export function mailTemplateToolbarExtras(editor: Editor): ReactNode {
  return <MailTemplateToolbarExtrasComponent editor={editor} />;
}
