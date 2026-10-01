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
import {
  ImageInsertDialog,
  type ImageConfirmAttrs,
} from '@modules/shared/components/tiptap/ImageInsertDialog';
import { ALIGN_STYLES } from '@modules/shared/components/tiptap/RichTextEditor';
import {
  useTemplateVariablesQuery,
  variableItemValue,
  variableKeyFromItemValue,
} from '@/modules/shared/hooks/useTemplateVariablesQuery';

type UploadMediaFn = (file: File) => Promise<{ mediaId: string; src: string }>;

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
  uploadMedia,
  insertHtml,
  insertText,
}: {
  editor: Editor;
  apiPath: string;
  uploadMedia?: UploadMediaFn;
  insertHtml?: (html: string) => void;
  insertText?: (text: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data } = useTemplateVariablesQuery(apiPath, 'mail');
  const grouped = data?.data ?? {};

  const insertVariable = (itemValue: string) => {
    const key = variableKeyFromItemValue(itemValue);
    if (insertText) {
      insertText(key);
      return;
    }
    editor.chain().focus().insertContent(key).run();
  };

  const handleConfirm = ({ src, alt, width, height, align, mediaId }: ImageConfirmAttrs) => {
    if (insertHtml) {
      const alignStyle = ALIGN_STYLES[align] ?? ALIGN_STYLES.left;
      const sizeStyle =
        `${width ? `width: ${width}px; ` : ''}${height ? `height: ${height}px;` : ''}`.trim();
      const style = sizeStyle ? `${alignStyle} ${sizeStyle}` : alignStyle;
      const widthAttr = width ? ` width="${width}"` : '';
      const heightAttr = height ? ` height="${height}"` : '';
      const mediaAttr = mediaId ? ` data-media-id="${mediaId}"` : '';
      insertHtml(
        `<img src="${src}" alt="${alt}"${widthAttr}${heightAttr} style="${style}"${mediaAttr}>`,
      );
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
          dataMediaId?: string;
        }) => { run(): boolean };
      }
    )
      .setImage({ src, alt, width, height, align, ...(mediaId ? { dataMediaId: mediaId } : {}) })
      .run();
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
        onFileUpload={uploadMedia}
        onConfirm={handleConfirm}
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
                <SelectItem
                  key={v.key}
                  value={variableItemValue(category, v.key)}
                  className="text-xs"
                >
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
 * @param apiPath     `'platform/template-variables'` (admin) ou `'template-variables'` (portail).
 * @param uploadMedia Fonction d'upload image (admin uniquement).
 */
export function makeMailTemplateToolbarExtras(
  apiPath = 'template-variables',
  uploadMedia?: UploadMediaFn,
): (
  editor: Editor,
  ctx?: { insertHtml: (html: string) => void; insertText: (text: string) => void },
) => ReactNode {
  return (
    editor: Editor,
    ctx?: { insertHtml: (html: string) => void; insertText: (text: string) => void },
  ) => (
    <MailTemplateToolbarExtrasComponent
      editor={editor}
      apiPath={apiPath}
      uploadMedia={uploadMedia}
      insertHtml={ctx?.insertHtml}
      insertText={ctx?.insertText}
    />
  );
}

/** Version portail (route tenant). */
export const mailTemplateToolbarExtras = makeMailTemplateToolbarExtras();
