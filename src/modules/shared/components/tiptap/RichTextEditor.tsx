import { useEffect, useState, type ReactNode } from "react";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALIGN_STYLES: Record<string, string> = {
  left: "float: left; margin: 0 1em 0.5em 0;",
  center: "display: block; margin: 0 auto 0.5em; clear: both;",
  right: "float: right; margin: 0 0 0.5em 1em;",
};

const ExtendedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attrs) =>
          attrs.width ? { width: String(attrs.width) } : {},
      },
      height: {
        default: null,
        renderHTML: (attrs) =>
          attrs.height ? { height: String(attrs.height) } : {},
      },
      align: {
        default: "left",
        renderHTML: (attrs) => ({
          style: ALIGN_STYLES[attrs.align as string] ?? ALIGN_STYLES.left,
        }),
      },
    };
  },
});
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Minus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare module "@tiptap/core" {
  interface Storage {
    markdown: {
      getMarkdown: () => string;
    };
  }
}

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  expandable?: boolean;
  /** Boutons optionnels ajoutés à la fin de la toolbar. Reçoit l'instance editor. */
  toolbarExtras?: (editor: Editor) => ReactNode;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("size-8", active && "bg-(--color-primary) text-white")}
    >
      {children}
    </Button>
  );
}

function Separator() {
  return <div className="mx-1 h-6 w-px self-center bg-border" />;
}

function Toolbar({
  editor,
  extras,
  onExpand,
  onMinimize,
}: {
  editor: Editor;
  extras?: (editor: Editor) => ReactNode;
  onExpand?: () => void;
  onMinimize?: () => void;
}) {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien", previousUrl ?? "");

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // S'abonne aux transactions de l'éditeur pour que les boutons
  // "actifs" (gras, titre, liste...) se mettent à jour en temps réel.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      heading1: editor.isActive("heading", { level: 1 }),
      heading2: editor.isActive("heading", { level: 2 }),
      heading3: editor.isActive("heading", { level: 3 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/30 p-1">
      <ToolbarButton
        label="Gras"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italique"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Barré"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Titre 1"
        active={state.heading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Titre 2"
        active={state.heading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Titre 3"
        active={state.heading3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Liste à puces"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Liste numérotée"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Citation"
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Ligne horizontale"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Insérer un lien"
        active={state.link}
        onClick={setLink}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Retirer le lien"
        disabled={!state.link}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Annuler"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Rétablir"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="size-4" />
      </ToolbarButton>

      {extras && (
        <>
          <Separator />
          {extras(editor)}
        </>
      )}

      {onExpand && (
        <>
          <Separator />
          <ToolbarButton label="Agrandir" onClick={onExpand}>
            <Maximize2 className="size-4" />
          </ToolbarButton>
        </>
      )}

      {onMinimize && (
        <>
          <Separator />
          <ToolbarButton label="Réduire" onClick={onMinimize}>
            <Minimize2 className="size-4" />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  expandable = true,
  toolbarExtras,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedContent, setExpandedContent] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      ExtendedImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Décrivez le cours…",
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        transformPastedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-32 w-full rounded-b-md border bg-background px-3 py-2 text-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "prose prose-sm max-w-none dark:prose-invert",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:mb-2 [&_h1]:mt-3 [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:mb-1 [&_h3]:mt-2",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
          "[&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:text-xs",
          "[&_a]:text-primary [&_a]:underline",
          // overflow-hidden crée un BFC : le texte ne passe pas sous le float
          "[&_p]:overflow-hidden",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  if (!editor) return null;

  const handleExpand = () => {
    setExpandedContent(editor.storage.markdown.getMarkdown());
    setIsExpanded(true);
  };

  const handleApply = () => {
    onChange(expandedContent);
    editor.commands.setContent(expandedContent);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        <Toolbar
          editor={editor}
          extras={toolbarExtras}
          onExpand={expandable ? handleExpand : undefined}
        />
        <EditorContent editor={editor} />
      </div>

      <Dialog
        open={isExpanded}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent
          className="flex flex-col gap-0 p-0 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl h-[90vh] sm:h-[85vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b px-4 py-3 shrink-0">
            <DialogTitle className="text-sm font-medium">
              Édition
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <RichTextEditor
              value={expandedContent}
              onChange={setExpandedContent}
              placeholder={placeholder}
              expandable={false}
              toolbarExtras={toolbarExtras}
              className="h-full [&_.tiptap]:min-h-[55vh]"
            />
          </div>

          <DialogFooter className="border-t px-4 py-3 shrink-0">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <Minimize2 className="mr-2 size-4" />
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="bg-(--color-primary) hover:bg-primary/80 text-primary-foreground"
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
