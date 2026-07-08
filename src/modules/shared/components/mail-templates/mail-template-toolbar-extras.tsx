'use client';

import { ImagePlus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageInsertDialog } from '@modules/shared/components/tiptap/ImageInsertDialog';
import { ALIGN_STYLES } from '@modules/shared/components/tiptap/RichTextEditor';
import { useTemplateVariablesQuery } from '@/modules/shared/hooks/useTemplateVariablesQuery';

/** Labels affichés pour chaque catégorie de variable. */
const CATEGORY_LABELS: Record<string, string> = {
  user: 'Apprenant',
  course: 'Formation',
  tenant: 'Organisation',
  certificate: 'Attestation',
};

function MailTemplateToolbarExtrasComponent({
  editor,
  apiPath,
  insertHtml,
}: {
  editor: Editor;
  apiPath: string;
  insertHtml?: (html: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data } = useTemplateVariablesQuery(apiPath, 'mail');
  const grouped = data?.data ?? {};

  /** La clé du backend inclut déjà `{{…}}`, on l'insère directement. */
  const insertVariable = (key: string) => {
    editor.chain().focus().insertContent(key).run();
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
          if (insertHtml) {
            const style = ALIGN_STYLES[align] ?? ALIGN_STYLES.left;
            const widthAttr = width ? ` width="${width}"` : '';
            const heightAttr = height ? ` height="${height}"` : '';
            insertHtml(`<img src="${src}" alt="${alt}"${widthAttr}${heightAttr} style="${style}">`);
            return;
          }
          (
            editor.chain().focus() as unknown as {
              setImage: (attrs: {
                src: string;
                alt: string;
                width: number | null;
                height: number | null;
                align: string;
              }) => { run(): boolean };
            }
          )
            .setImage({ src, alt, width, height, align })
            .run();
        }}
      />

      <Select onValueChange={insertVariable}>
        <SelectTrigger className="h-8 w-44 text-xs" aria-label="Insérer une variable">
          <SelectValue placeholder="Variable…" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(grouped).map(([category, variables]) => (
            <SelectGroup key={category}>
              <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[category] ?? category}
              </SelectLabel>
              {variables.map((v) => (
                <SelectItem key={v.key} value={v.key} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

/**
 * Crée la fonction `toolbarExtras` pour les templates mail.
 *
 * @param apiPath  `'platform/template-variables'` (admin) ou `'template-variables'` (portail).
 */
export function makeMailTemplateToolbarExtras(
  apiPath = 'template-variables',
): (editor: Editor, ctx?: { insertHtml: (html: string) => void }) => ReactNode {
  return (editor: Editor, ctx?: { insertHtml: (html: string) => void }) => (
    <MailTemplateToolbarExtrasComponent
      editor={editor}
      apiPath={apiPath}
      insertHtml={ctx?.insertHtml}
    />
  );
}

/** Version portail (route tenant). */
export const mailTemplateToolbarExtras = makeMailTemplateToolbarExtras();
