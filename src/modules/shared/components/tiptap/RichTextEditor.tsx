import { useState, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import { DOMParser as PmDOMParser } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Minus,
  Maximize2,
  Minimize2,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  RemoveFormatting,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        renderHTML: (attrs) => {
          const base = ALIGN_STYLES[attrs.align as string] ?? ALIGN_STYLES.left;
          const w = attrs.width ? ` width: ${attrs.width}px;` : '';
          const h = attrs.height ? ` height: ${attrs.height}px;` : '';
          return { style: base + w + h };
        },
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
   * Format de sortie emis dans `onChange`.
   * - `'tiptap-html'` (defaut) : HTML via Tiptap WYSIWYG, pour les champs richtext
   * - `'html'` : HTML brut via contenteditable, pour attestations et templates mail
   *   (preserve les styles inline que le schema ProseMirror degraderait)
   */
  outputFormat?: 'tiptap-html' | 'html';
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

const TEXT_COLORS = [
  '#000000',
  '#374151',
  '#6b7280',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
];

const HIGHLIGHT_COLORS = [
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#e9d5ff',
  '#fed7aa',
  '#e5e7eb',
];

function ColorPicker({
  label,
  icon,
  colors,
  onPick,
  onReset,
}: {
  label: string;
  icon: ReactNode;
  colors: string[];
  onPick: (color: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('#2563eb');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          title={label}
          className="size-8"
          // Empeche la perte de selection dans le contenteditable a l'ouverture.
          onMouseDown={(e) => e.preventDefault()}
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-5 gap-1">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              title={color}
              className="size-6 rounded border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(color);
                setOpen(false);
              }}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-1.5 border-t pt-2">
          <input
            type="color"
            aria-label="Couleur personnalisée"
            value={custom}
            className="size-7 cursor-pointer rounded border border-border bg-transparent p-0.5"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => setCustom(e.target.value)}
          />
          <input
            type="text"
            aria-label="Code hexadécimal"
            value={custom}
            spellCheck={false}
            className="h-7 w-20 rounded border border-border bg-background px-1.5 font-mono text-xs uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={!/^#[0-9a-f]{6}$/i.test(custom)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onPick(custom);
              setOpen(false);
            }}
          >
            OK
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-7 w-full text-xs"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onReset();
            setOpen(false);
          }}
        >
          Réinitialiser
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({
  editor,
  extras,
  onExpand,
  onMinimize,
  onToggleSource,
  sourceMode,
  rawHtmlExec,
  overrideActive,
}: {
  editor: Editor;
  extras?: (editor: Editor) => ReactNode;
  onExpand?: () => void;
  onMinimize?: () => void;
  onToggleSource?: () => void;
  sourceMode?: boolean;
  /** When provided, buttons use execCommand on the raw contenteditable instead of Tiptap. */
  rawHtmlExec?: (command: string, value?: string) => void;
  /** When provided, overrides Tiptap-based active state (used in html contenteditable mode). */
  overrideActive?: {
    bold: boolean;
    italic: boolean;
    strike: boolean;
    code: boolean;
    heading1: boolean;
    heading2: boolean;
    heading3: boolean;
    bulletList: boolean;
    orderedList: boolean;
    superscript: boolean;
    subscript: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
  };
}) {
  const setLink = () => {
    if (rawHtmlExec) {
      const url = window.prompt('URL du lien', '');
      if (url === null) return;
      if (url === '') rawHtmlExec('unlink');
      else rawHtmlExec('createLink', url);
      return;
    }
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
      link: editor.isActive('link'),
      superscript: editor.isActive('superscript'),
      subscript: editor.isActive('subscript'),
      alignLeft: editor.isActive({ textAlign: 'left' }),
      alignCenter: editor.isActive({ textAlign: 'center' }),
      alignRight: editor.isActive({ textAlign: 'right' }),
      alignJustify: editor.isActive({ textAlign: 'justify' }),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 bg-muted/30 p-1">
      <ToolbarButton
        label="Gras"
        active={overrideActive ? overrideActive.bold : state.bold}
        onClick={() =>
          rawHtmlExec ? rawHtmlExec('bold') : editor.chain().focus().toggleBold().run()
        }
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italique"
        active={overrideActive ? overrideActive.italic : state.italic}
        onClick={() =>
          rawHtmlExec ? rawHtmlExec('italic') : editor.chain().focus().toggleItalic().run()
        }
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Barré"
        active={overrideActive ? overrideActive.strike : state.strike}
        onClick={() =>
          rawHtmlExec ? rawHtmlExec('strikeThrough') : editor.chain().focus().toggleStrike().run()
        }
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={overrideActive ? overrideActive.code : state.code}
        onClick={() =>
          rawHtmlExec ? rawHtmlExec('code') : editor.chain().focus().toggleCode().run()
        }
      >
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Exposant"
        active={overrideActive ? overrideActive.superscript : state.superscript}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('superscript')
            : editor.chain().focus().toggleSuperscript().run()
        }
      >
        <SuperscriptIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Indice"
        active={overrideActive ? overrideActive.subscript : state.subscript}
        onClick={() =>
          rawHtmlExec ? rawHtmlExec('subscript') : editor.chain().focus().toggleSubscript().run()
        }
      >
        <SubscriptIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Effacer la mise en forme"
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('removeFormat')
            : editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
      >
        <RemoveFormatting className="size-4" />
      </ToolbarButton>

      <Separator />

      <ColorPicker
        label="Couleur du texte"
        icon={<Baseline className="size-4" />}
        colors={TEXT_COLORS}
        onPick={(color) =>
          rawHtmlExec
            ? rawHtmlExec('foreColor', color)
            : editor.chain().focus().setColor(color).run()
        }
        onReset={() =>
          rawHtmlExec
            ? rawHtmlExec('foreColor', 'inherit')
            : editor.chain().focus().unsetColor().run()
        }
      />
      <ColorPicker
        label="Couleur de surlignage"
        icon={<Highlighter className="size-4" />}
        colors={HIGHLIGHT_COLORS}
        onPick={(color) =>
          rawHtmlExec
            ? rawHtmlExec('hiliteColor', color)
            : editor.chain().focus().setHighlight({ color }).run()
        }
        onReset={() =>
          rawHtmlExec
            ? rawHtmlExec('hiliteColor', 'transparent')
            : editor.chain().focus().unsetHighlight().run()
        }
      />

      <Separator />

      <ToolbarButton
        label="Aligner à gauche"
        active={overrideActive ? overrideActive.alignLeft : state.alignLeft}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('justifyLeft')
            : editor.chain().focus().setTextAlign('left').run()
        }
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Centrer"
        active={overrideActive ? overrideActive.alignCenter : state.alignCenter}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('justifyCenter')
            : editor.chain().focus().setTextAlign('center').run()
        }
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Aligner à droite"
        active={overrideActive ? overrideActive.alignRight : state.alignRight}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('justifyRight')
            : editor.chain().focus().setTextAlign('right').run()
        }
      >
        <AlignRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Justifier"
        active={overrideActive ? overrideActive.alignJustify : state.alignJustify}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('justifyFull')
            : editor.chain().focus().setTextAlign('justify').run()
        }
      >
        <AlignJustify className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Titre 1"
        active={overrideActive ? overrideActive.heading1 : state.heading1}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('formatBlock', overrideActive?.heading1 ? 'p' : 'h1')
            : editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Titre 2"
        active={overrideActive ? overrideActive.heading2 : state.heading2}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('formatBlock', overrideActive?.heading2 ? 'p' : 'h2')
            : editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Titre 3"
        active={overrideActive ? overrideActive.heading3 : state.heading3}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('formatBlock', overrideActive?.heading3 ? 'p' : 'h3')
            : editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Liste à puces"
        active={overrideActive ? overrideActive.bulletList : state.bulletList}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('insertUnorderedList')
            : editor.chain().focus().toggleBulletList().run()
        }
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Liste numérotée"
        active={overrideActive ? overrideActive.orderedList : state.orderedList}
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('insertOrderedList')
            : editor.chain().focus().toggleOrderedList().run()
        }
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Ligne horizontale"
        onClick={() =>
          rawHtmlExec
            ? rawHtmlExec('insertHorizontalRule')
            : editor.chain().focus().setHorizontalRule().run()
        }
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
        onClick={() =>
          rawHtmlExec ? rawHtmlExec('unlink') : editor.chain().focus().unsetLink().run()
        }
      >
        <Unlink className="size-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Annuler"
        disabled={!state.canUndo}
        onClick={() => (rawHtmlExec ? rawHtmlExec('undo') : editor.chain().focus().undo().run())}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Rétablir"
        disabled={!state.canRedo}
        onClick={() => (rawHtmlExec ? rawHtmlExec('redo') : editor.chain().focus().redo().run())}
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
  outputFormat = 'tiptap-html',
  toolbarExtras,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedContent, setExpandedContent] = useState('');
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState('');
  // Active formatting state for html mode (driven by document.queryCommandState, not Tiptap).
  const [htmlActiveState, setHtmlActiveState] = useState({
    bold: false,
    italic: false,
    strike: false,
    code: false,
    heading1: false,
    heading2: false,
    heading3: false,
    bulletList: false,
    orderedList: false,
    superscript: false,
    subscript: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
  });

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
      Superscript,
      Subscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-32 w-full rounded-b-md border bg-background px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'prose prose-sm max-w-none dark:prose-invert',
          '[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:mb-2 [&_h1]:mt-3 [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:mb-1 [&_h3]:mt-2',
          '[&_a]:text-primary [&_a]:underline',
          // overflow-y:auto crée un BFC → contient les images flottantes.
          'max-h-96 overflow-y-auto after:content-[""] after:block after:clear-both',
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
      // Mode html : le contenu est géré via le div contenteditable, pas TipTap.
      if (outputFormat === 'html') return;
      onChange(editor.getHTML());
    },
  });

  // Synchronise les changements externes de `value` vers l'éditeur markdown.
  // En mode HTML, TipTap n'est pas affiché : on ne passe jamais par setContent
  // pour éviter que le schéma ProseMirror ne dénature les styles/divs custom.
  useEffect(() => {
    if (!editor || outputFormat === 'html') return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: outputFormat is a stable prop
  }, [value, editor]);

  // Sync externe value → div contenteditable (mode html uniquement).
  const htmlPreviewRef = useRef<HTMLDivElement>(null);
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const savedRangeRef = useRef<Range | null>(null);

  // Retrouve le <code> concerné par la sélection : soit la sélection est dedans,
  // soit elle l'enveloppe entièrement (état juste après surroundContents).
  const findCodeAncestor = (): HTMLElement | null => {
    const el = htmlPreviewRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const start = range.startContainer;
    const startEl = start.nodeType === Node.TEXT_NODE ? start.parentElement : (start as Element);
    const inside = startEl?.closest('code');
    if (inside && el.contains(inside)) return inside as HTMLElement;
    const container = range.commonAncestorContainer;
    const scope =
      container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement;
    for (const c of Array.from(scope?.querySelectorAll('code') ?? [])) {
      if (range.intersectsNode(c) && el.contains(c)) return c as HTMLElement;
    }
    return null;
  };

  const syncHtmlActiveState = () => {
    try {
      const block = document.queryCommandValue('formatBlock').toLowerCase();
      setHtmlActiveState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        strike: document.queryCommandState('strikeThrough'),
        code: findCodeAncestor() !== null,
        heading1: block === 'h1',
        heading2: block === 'h2',
        heading3: block === 'h3',
        bulletList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        superscript: document.queryCommandState('superscript'),
        subscript: document.queryCommandState('subscript'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
      });
    } catch {
      /* queryCommandState throws in rare edge cases */
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    const el = htmlPreviewRef.current;
    if (sel && sel.rangeCount > 0 && el && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      syncHtmlActiveState();
    }
  };

  const htmlPreviewCallbackRef = useCallback((el: HTMLDivElement | null) => {
    (htmlPreviewRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (el) el.innerHTML = latestValueRef.current ?? '';
  }, []);

  useLayoutEffect(() => {
    if (outputFormat !== 'html' || sourceMode) return;
    const el = htmlPreviewRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== value) el.innerHTML = value ?? '';
  }, [value, outputFormat, sourceMode]);

  if (!editor) return null;

  // Applique un execCommand sur le contenteditable en restaurant la sélection sauvegardée.
  // 'code' est géré via DOM (pas d'équivalent execCommand).
  const rawHtmlExec =
    outputFormat === 'html' && !sourceMode
      ? (command: string, value?: string) => {
          const el = htmlPreviewRef.current;
          if (!el) return;
          const savedRange = savedRangeRef.current;
          if (savedRange && el.contains(savedRange.commonAncestorContainer)) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(savedRange);
          } else {
            // Sans range memorise, focus() seul ne place aucun caret : execCommand
            // n'aurait alors aucun bloc cible. On pose le caret en fin de contenu.
            el.focus();
            const r = document.createRange();
            r.selectNodeContents(el);
            r.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(r);
          }
          // formatBlock et les listes exigent un conteneur de bloc : un noeud texte
          // nu a la racine du contenteditable les fait echouer silencieusement.
          if (command === 'formatBlock' || command.startsWith('insert')) {
            for (const node of Array.from(el.childNodes)) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                const p = document.createElement('p');
                el.insertBefore(p, node);
                p.appendChild(node);
              }
            }
          }
          if (command === 'code') {
            const sel = window.getSelection();
            const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
            const existing = findCodeAncestor();
            const parent = existing?.parentNode;
            if (existing && parent) {
              const partiel =
                range && !range.collapsed && existing.contains(range.commonAncestorContainer);
              if (partiel) {
                // Decoupe le <code> en trois : avant / selection liberee / apres.
                const afterRange = document.createRange();
                afterRange.setStart(range.endContainer, range.endOffset);
                afterRange.setEnd(existing, existing.childNodes.length);
                const afterFrag = afterRange.extractContents();
                const midFrag = range.extractContents();

                const ref = existing.nextSibling;
                const midFirst = midFrag.firstChild;
                const midLast = midFrag.lastChild;
                parent.insertBefore(midFrag, ref);

                if (afterFrag.textContent) {
                  const tail = document.createElement('code');
                  tail.appendChild(afterFrag);
                  parent.insertBefore(tail, ref);
                }
                if (!existing.textContent) parent.removeChild(existing);

                if (midFirst && midLast) {
                  const r = document.createRange();
                  r.setStartBefore(midFirst);
                  r.setEndAfter(midLast);
                  sel?.removeAllRanges();
                  sel?.addRange(r);
                  savedRangeRef.current = r.cloneRange();
                }
              } else {
                // Curseur seul : rien a decouper, on retire le <code> entier.
                const first = existing.firstChild;
                const last = existing.lastChild;
                while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
                parent.removeChild(existing);
                if (first && last) {
                  const r = document.createRange();
                  r.setStartBefore(first);
                  r.setEndAfter(last);
                  sel?.removeAllRanges();
                  sel?.addRange(r);
                  savedRangeRef.current = r.cloneRange();
                }
              }
            } else if (range && !range.collapsed) {
              const code = document.createElement('code');
              try {
                range.surroundContents(code);
                // Repositionne la sélection DANS le <code> pour que le clic suivant le détecte.
                const r = document.createRange();
                r.selectNodeContents(code);
                sel?.removeAllRanges();
                sel?.addRange(r);
                savedRangeRef.current = r.cloneRange();
              } catch {
                /* sélection à cheval sur plusieurs éléments */
              }
            }
          } else {
            // styleWithCSS : produit <span style="color:…"> au lieu du <font> deprecie.
            document.execCommand('styleWithCSS', false, 'true');
            // Sans ca Chrome cree des <div> a l'appui sur Entree, que formatBlock gere mal.
            document.execCommand('defaultParagraphSeparator', false, 'p');
            document.execCommand(command, false, value);
            // execCommand remplace le bloc : l'ancien range pointe sur des nœuds détruits.
            // On re-capture la sélection vivante, sinon le prochain clic agit sur un range collapsé.
            const sel = window.getSelection();
            const live = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            savedRangeRef.current =
              live && el.contains(live.commonAncestorContainer) ? live.cloneRange() : null;
          }
          onChange(el.innerHTML);
          syncHtmlActiveState();
        }
      : undefined;
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

  // Insère du texte brut (ex : variables {{user.name}}) sans interprétation HTML.
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
      setSourceValue(outputFormat === 'html' ? value : editor.getHTML());
      setSourceMode(true);
    } else {
      if (outputFormat === 'html') {
        // Ne repasse pas par TipTap : ProseMirror supprimerait les styles custom.
        onChange(sourceValue);
      } else {
        editor.commands.setContent(sourceValue, { emitUpdate: false });
        onChange(editor.getHTML());
      }
      setSourceMode(false);
    }
  };

  const handleExpand = () => {
    setExpandedContent(outputFormat === 'html' ? value : editor.getHTML());
    setIsExpanded(true);
  };

  const handleApply = () => {
    onChange(expandedContent);
    // Mode html : ne pas repasser par setContent (ProseMirror supprimerait les styles custom).
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
          onToggleSource={handleToggleSource}
          sourceMode={sourceMode}
          rawHtmlExec={rawHtmlExec}
          overrideActive={outputFormat === 'html' ? htmlActiveState : undefined}
        />
        {sourceMode ? (
          <textarea
            ref={sourceTextareaRef}
            className="min-h-32 max-h-96 overflow-y-auto w-full rounded-b-md border bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs px-3 py-2 resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={sourceValue}
            onChange={(e) => {
              setSourceValue(e.target.value);
              onChange(e.target.value);
            }}
            spellCheck={false}
          />
        ) : outputFormat === 'html' ? (
          // Contenteditable brut : préserve les styles inline et divs custom des certificats.
          <div
            ref={htmlPreviewCallbackRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
            onSelect={saveSelection}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            className={cn(
              'richtext-content',
              'min-h-32 max-h-96 overflow-y-auto w-full rounded-b-md border bg-background px-3 py-2 text-sm',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              '[&_a]:text-primary [&_a]:underline',
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
              className="h-full [&_.tiptap]:min-h-[55vh] [&_.ProseMirror]:max-h-none"
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
