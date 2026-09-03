'use client';

import { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Editor } from '@tiptap/react';
import { RichTextEditor } from '@/modules/shared/components/tiptap/RichTextEditor';
import {
  ImageInsertDialog,
  type ImageConfirmAttrs,
} from '@/modules/shared/components/tiptap/ImageInsertDialog';
import { mediaApi } from '@/shared/api/media.api';

interface RichtextImageToolbarExtraProps {
  editor: Editor;
  contentTypeId: string;
  fieldId: string;
}

function RichtextImageToolbarExtra({
  editor,
  contentTypeId,
  fieldId,
}: RichtextImageToolbarExtraProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const uploadImage = async (file: File): Promise<{ mediaId: string; src: string }> => {
    const res = await mediaApi.uploadInline(file, contentTypeId, fieldId);
    return { mediaId: res.data.id, src: res.data.url };
  };

  const handleConfirm = ({ src, alt, width, height, align, mediaId }: ImageConfirmAttrs) => {
    (
      editor.chain().focus() as unknown as {
        setImage: (attrs: Record<string, unknown>) => { run(): boolean };
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
        onFileUpload={uploadImage}
      />
    </>
  );
}

interface RichTextFieldProps {
  value: unknown;
  onChange: (val: unknown) => void;
  label: string;
  contentTypeId: string;
  fieldId: string;
}

export function RichTextField({
  value,
  onChange,
  label,
  contentTypeId,
  fieldId,
}: RichTextFieldProps) {
  return (
    <RichTextEditor
      value={(value as string) ?? ''}
      onChange={onChange}
      placeholder={label}
      outputFormat="tiptap-html"
      toolbarExtras={(editor) => (
        <RichtextImageToolbarExtra
          editor={editor}
          contentTypeId={contentTypeId}
          fieldId={fieldId}
        />
      )}
    />
  );
}
