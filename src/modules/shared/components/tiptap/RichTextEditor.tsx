import { useState, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import { DOMParser as PmDOMParser } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Code2,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare module '@tiptap/core' {
  interface Storage {
    markdown: {
      getMarkdown: () => string;
    };
  }
}
export const ALIGN_STYLES: Record<string, string> = {
  left: 'float: left; margin: 0 1em 0.5em 0;',
  center: 'display: block; margin: 0 auto 1em; float: none;',
  right: 'float: right; margin: 0 0 0.5em 1em;',
};

const ExtendedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width') ?? null,
        renderHTML: (attrs) => (attrs.width ? { width: String(attrs.width) } : {}),
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('height') ?? null,
        renderHTML: (attrs) => (attrs.height ? { height: String(attrs.height) } : {}),
      },
      align: {
        default: 'left',
        parseHTML: (element: HTMLElement) => {
          const style = element.getAttribute('style') ?? '';
          if (style.includes('float: right') || style.includes('float:right')) return 'right';
          if (style.includes('margin: 0 auto') || style.includes('margin:0 auto')) return 'center';
          return 'left';
        },
        renderHTML: (attrs) => ({
          style: ALIGN_STYLES[attrs.align as string] ?? ALIGN_STYLES.left,
        }),
      },
      dataMediaId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-media-id') ?? null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.dataMediaId ? { 'data-media-id': String(attrs.dataMediaId) } : {},
      },
    };
  },
});

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  expandable?: boolean;
  /**
   * Format de sortie émis dans `onChange`.
   * - `'markdown'` (défaut) : texte Markdown
   * - `'html'` : HTML brut (pour attestations et templates mail)
   */
  outputFormat?: 'markdown' | 'html';
  /** Boutons optionnels ajoutés à la fin de la toolbar. Reçoit l'instance editor.
   * En mode `html`, un second argument `ctx` est fourni :
   * - `ctx.insertHtml`  : insère du HTML brut dans le contenteditable
   * - `ctx.insertText`  : insère du texte brut (variables) sans risque d'interprétation HTML */
  toolbarExtras?: (
    editor: Editor,
    ctx?: { insertHtml: (html: string) => void; insertText: (text: string) => void },
  ) => ReactNode;
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
      className={cn('size-8', active && 'bg-(--color-primary) text-white')}
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
  onToggleSource,
  sourceMode,
}: {
  editor: Editor;
  extras?: (editor: Editor) => ReactNode;
  onExpand?: () => void;
  onMinimize?: () => void;
  onToggleSource?: () => void;
  sourceMode?: boolean;
}) {
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien', previousUrl ?? '');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // S'abonne aux transactions de l'éditeur pour que les boutons
  // "actifs" (gras, titre, liste...) se mettent à jour en temps réel.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      heading1: editor.isActive('heading', { level: 1 }),
      heading2: editor.isActive('heading', { level: 2 }),
      heading3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      link: editor.isActive('link'),
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

      <ToolbarButton label="Insérer un lien" active={state.link} onClick={setLink}>
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

      {onToggleSource && (
        <>
          <Separator />
          <ToolbarButton label="Source HTML" active={sourceMode} onClick={onToggleSource}>
            <Code2 className="size-4" />
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
  outputFormat = 'markdown',
  toolbarExtras,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedContent, setExpandedContent] = useState('');
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState('');

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
        placeholder: placeholder ?? 'Décrivez le cours…',
      }),
      ...(outputFormat === 'markdown'
        ? [
            Markdown.configure({
              html: false,
              tightLists: true,
              transformPastedText: true,
            }),
          ]
        : []),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-32 w-full rounded-b-md border bg-background px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'prose prose-sm max-w-none dark:prose-invert',
          '[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:mb-2 [&_h1]:mt-3 [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:mb-1 [&_h3]:mt-2',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic',
          '[&_code]:rounded [&_code]:bg-[#1e1e1e] [&_code]:text-[#d4d4d4] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono',
          '[&_pre]:rounded [&_pre]:bg-[#1e1e1e] [&_pre]:text-[#d4d4d4] [&_pre]:p-4 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
          '[&_a]:text-primary [&_a]:underline',
        ),
      },
      // Mode HTML : on intercepte TOUJOURS le coller si le text/plain contient
      // des balises HTML — que le navigateur fournisse ou non un text/html
      // (ex : copie depuis VS Code qui ajoute du text/html avec coloration).
      handlePaste:
        outputFormat === 'html'
          ? (view, event) => {
              const plain = event.clipboardData?.getData('text/plain') ?? '';
              if (!/<[a-z][^>]*>/i.test(plain)) return false;
              event.preventDefault();
              const dom = new window.DOMParser().parseFromString(plain, 'text/html');
              const parser = PmDOMParser.fromSchema(view.state.schema);
              const slice = parser.parseSlice(dom.body);
              view.dispatch(view.state.tr.replaceSelection(slice));
              return true;
            }
          : undefined,
    },
    onUpdate: ({ editor }) => {
      // En mode HTML le contenu est géré via le div contenteditable, pas TipTap.
      if (outputFormat === 'html') return;
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // Synchronise les changements externes de `value` vers l'éditeur markdown.
  // En mode HTML, TipTap n'est pas affiché : on ne passe jamais par setContent
  // pour éviter que le schéma ProseMirror ne dénature les styles/divs custom.
  useEffect(() => {
    if (!editor || outputFormat === 'html') return;
    const current = editor.storage.markdown.getMarkdown();
    if (current !== value) {
      editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: outputFormat is a stable prop
  }, [value, editor]);

  // Sync externe value → div contenteditable (mode HTML uniquement).
  const htmlPreviewRef = useRef<HTMLDivElement>(null);
  // Ref pour la textarea en mode source.
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Toujours à jour pendant le render : utilisé dans la callback ref ci-dessous.
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  // Sauvegarde du dernier range de sélection dans le contenteditable.
  // Nécessaire car l'ouverture du dialog image fait perdre le focus (et donc
  // la sélection) avant qu'on appelle insertHtmlAtCursor.
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    const el = htmlPreviewRef.current;
    if (sel && sel.rangeCount > 0 && el && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Callback ref : appelé immédiatement à chaque montage du div (même quand
  // TipTap s'initialise en différé ou quand sourceMode bascule).
  // Grâce à latestValueRef, la valeur est toujours celle du dernier render.
  const htmlPreviewCallbackRef = useCallback((el: HTMLDivElement | null) => {
    (htmlPreviewRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (el) {
      el.innerHTML = latestValueRef.current ?? '';
    }
  }, []); // stable — latestValueRef mis à jour inline à chaque render

  // Sync value → div quand la valeur change depuis le parent (ex : form.reset)
  // mais que l'utilisateur n'est pas en train d'éditer.
  useLayoutEffect(() => {
    if (outputFormat !== 'html' || sourceMode) return;
    const el = htmlPreviewRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value ?? '';
    }
  }, [value, outputFormat, sourceMode]);

  if (!editor) return null;

  // En mode HTML, insère du HTML à la position sauvegardée dans le contenteditable.
  const insertHtmlAtCursor = (html: string) => {
    const el = htmlPreviewRef.current;
    if (!el) return;
    el.focus();
    const savedRange = savedRangeRef.current;
    if (savedRange && el.contains(savedRange.commonAncestorContainer)) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
      savedRange.deleteContents();
      const frag = document.createRange().createContextualFragment(html);
      savedRange.insertNode(frag);
      sel?.collapseToEnd();
      savedRangeRef.current = null;
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
    onChange(el.innerHTML);
  };

  // En mode HTML, insère du texte brut (pas parsé comme HTML) à la position sauvegardée.
  // Utilisé pour les variables `{{user.name}}` qui ne doivent pas être interprétées.
  const insertTextAtCursor = (text: string) => {
    const el = htmlPreviewRef.current;
    if (!el) return;
    el.focus();
    const savedRange = savedRangeRef.current;
    const textNode = document.createTextNode(text);
    if (savedRange && el.contains(savedRange.commonAncestorContainer)) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange);
      savedRange.deleteContents();
      savedRange.insertNode(textNode);
      sel?.collapseToEnd();
      savedRangeRef.current = null;
    } else {
      el.appendChild(textNode);
    }
    onChange(el.innerHTML);
  };

  // En mode source, insère du texte (HTML ou variable) à la position du curseur dans la textarea.
  const insertIntoSource = (text: string) => {
    const el = sourceTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? sourceValue.length;
    const end = el.selectionEnd ?? start;
    const next = sourceValue.slice(0, start) + text + sourceValue.slice(end);
    setSourceValue(next);
    onChange(next);
    // Repositionne le curseur après le texte inséré.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  // Wrapper pour toolbarExtras : en mode HTML, passe les deux helpers en contexte.
  const wrappedToolbarExtras = toolbarExtras
    ? outputFormat === 'html'
      ? (editor: Editor) =>
          toolbarExtras(editor, {
            insertHtml: sourceMode ? insertIntoSource : insertHtmlAtCursor,
            insertText: sourceMode ? insertIntoSource : insertTextAtCursor,
          })
      : toolbarExtras
    : undefined;

  const handleToggleSource = () => {
    if (!sourceMode) {
      // Passe en mode source : pour le mode HTML on utilise `value` directement
      // (évite que getHTML() retourne un HTML dénaturé par le schéma ProseMirror).
      setSourceValue(outputFormat === 'html' ? value : editor.getHTML());
      setSourceMode(true);
    } else {
      if (outputFormat === 'html') {
        // Mode HTML : on NE repasse PAS par TipTap (son schéma ProseMirror supprime
        // les styles, divs arbitraires, etc.). On appelle simplement onChange et on
        // affiche un preview via dangerouslySetInnerHTML.
        onChange(sourceValue);
      } else {
        // Mode markdown : repasse dans TipTap WYSIWYG normalement.
        editor.commands.setContent(sourceValue, { emitUpdate: false });
        onChange(editor.getHTML());
      }
      setSourceMode(false);
    }
  };

  const handleExpand = () => {
    // En mode HTML, utiliser `value` directement pour ne pas passer
    // par editor.getHTML() qui dégraderait le HTML via ProseMirror.
    setExpandedContent(outputFormat === 'html' ? value : editor.storage.markdown.getMarkdown());
    setIsExpanded(true);
  };

  const handleApply = () => {
    onChange(expandedContent);
    // En mode HTML, ne pas repasser par setContent (ProseMirror supprimerait
    // les styles/divs custom). Le useEffect de sync htmlPreviewRef s'en charge.
    if (outputFormat !== 'html') {
      editor.commands.setContent(expandedContent);
    }
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <div className={cn('flex flex-col', className)}>
        <Toolbar
          editor={editor}
          extras={wrappedToolbarExtras}
          onExpand={expandable ? handleExpand : undefined}
          onToggleSource={outputFormat === 'html' ? handleToggleSource : undefined}
          sourceMode={sourceMode}
        />
        {sourceMode ? (
          <textarea
            ref={sourceTextareaRef}
            className="min-h-32 w-full rounded-b-md border bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs px-3 py-2 resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={sourceValue}
            onChange={(e) => {
              setSourceValue(e.target.value);
              onChange(e.target.value);
            }}
            spellCheck={false}
          />
        ) : outputFormat === 'html' ? (
          // Contenteditable brut : le navigateur conserve le HTML tel quel
          // (styles inline, divs arbitraires, position:absolute…) sans jamais
          // passer par le schéma ProseMirror qui supprimerait tout cela.
          // La valeur initiale est injectée via ref/useEffect pour éviter
          // les conflits de cursor avec dangerouslySetInnerHTML.
          <div
            ref={htmlPreviewCallbackRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
            onSelect={saveSelection}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            className={cn(
              'min-h-32 w-full rounded-b-md border bg-background px-3 py-2 text-sm overflow-auto',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      <Dialog open={isExpanded} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent
          className="flex flex-col gap-0 p-0 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl h-[90vh] sm:h-[85vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b px-4 py-3 shrink-0">
            <DialogTitle className="text-sm font-medium">Édition</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <RichTextEditor
              value={expandedContent}
              onChange={setExpandedContent}
              placeholder={placeholder}
              expandable={false}
              outputFormat={outputFormat}
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
