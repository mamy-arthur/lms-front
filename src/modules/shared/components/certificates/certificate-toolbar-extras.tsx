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
import { useTemplateVariablesQuery } from '@/modules/shared/hooks/useTemplateVariablesQuery';

type UploadMediaFn = (file: File) => Promise<{ mediaId: string }>;

/** Labels affichés pour chaque catégorie de variable. */
const CATEGORY_LABELS: Record<string, string> = {
  user: 'Apprenant',
  course: 'Formation',
  tenant: 'Organisation',
  certificate: 'Attestation',
};

function CertificateToolbarExtrasComponent({
  editor,
  uploadMedia,
  apiPath,
  insertHtml,
  insertText,
}: {
  editor: Editor;
  uploadMedia?: UploadMediaFn;
  apiPath: string;
  insertHtml?: (html: string) => void;
  insertText?: (text: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data } = useTemplateVariablesQuery(apiPath, 'attestation');
  const grouped = data?.data ?? {};

  /** La clé du backend inclut déjà `{{…}}`, on l'insère directement. */
  const insertVariable = (key: string) => {
    if (insertText) {
      insertText(key);
      return;
    }
    editor.chain().focus().insertContent(key).run();
  };

  const handleConfirm = ({ src, alt, width, height, align, mediaId }: ImageConfirmAttrs) => {
    if (insertHtml) {
      // Mode HTML brut : construire le tag <img> directement sans passer par ProseMirror.
      const style = ALIGN_STYLES[align] ?? ALIGN_STYLES.left;
      const widthAttr = width ? ` width="${width}"` : '';
      const heightAttr = height ? ` height="${height}"` : '';
      const mediaAttr = mediaId ? ` data-media-id="${mediaId}"` : '';
      insertHtml(
        `<img src="${src}" alt="${alt}"${widthAttr}${heightAttr} style="${style}"${mediaAttr}>`,
      );
      return;
    }
    // Mode markdown/TipTap normal.
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
        onConfirm={handleConfirm}
        onFileUpload={uploadMedia}
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
 * Crée la fonction `toolbarExtras` pour le RichTextEditor.
 *
 * @param options.uploadMedia  Fonction d'upload (admin uniquement).
 * @param options.apiPath      Chemin de l'API template-variables.
 *   - Admin (platform) : `'platform/template-variables'`
 *   - Portail (tenant) : `'template-variables'`
 */
export function makeCertificateToolbarExtras(options?: {
  uploadMedia?: UploadMediaFn;
  apiPath?: string;
}): (
  editor: Editor,
  ctx?: { insertHtml: (html: string) => void; insertText: (text: string) => void },
) => ReactNode {
  const { uploadMedia, apiPath = 'template-variables' } = options ?? {};
  return (
    editor: Editor,
    ctx?: { insertHtml: (html: string) => void; insertText: (text: string) => void },
  ) => (
    <CertificateToolbarExtrasComponent
      editor={editor}
      uploadMedia={uploadMedia}
      apiPath={apiPath}
      insertHtml={ctx?.insertHtml}
      insertText={ctx?.insertText}
    />
  );
}

/** Version portail (sans upload, route tenant). */
