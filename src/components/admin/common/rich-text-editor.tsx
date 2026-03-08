'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import {
  EditorContent,
  useEditor,
  type Editor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Heading4,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function sanitizeHtml(input: string): string {
  if (!input) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');

  const allowedTags = new Set([
    'P',
    'BR',
    'H2',
    'H3',
    'H4',
    'STRONG',
    'EM',
    'U',
    'A',
    'UL',
    'OL',
    'LI',
    'BLOCKQUOTE',
    'TABLE',
    'THEAD',
    'TBODY',
    'TR',
    'TH',
    'TD',
    'IMG',
  ]);

  const allowedAttrs: Record<string, Set<string>> = {
    A: new Set(['href', 'target', 'rel']),
    IMG: new Set(['src', 'alt']),
    TH: new Set(['colspan', 'rowspan']),
    TD: new Set(['colspan', 'rowspan']),
  };

  function walk(node: Node): void {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName.toUpperCase();

        if (!allowedTags.has(tagName)) {
          while (element.firstChild) {
            node.insertBefore(element.firstChild, element);
          }
          node.removeChild(element);
          continue;
        }

        for (const attr of Array.from(element.attributes)) {
          const allowSet = allowedAttrs[tagName];
          const attrName = attr.name.toLowerCase();
          if (!allowSet || !allowSet.has(attrName)) {
            element.removeAttribute(attr.name);
          }
        }

        if (tagName === 'A') {
          const href = element.getAttribute('href') ?? '';
          const isSafe =
            href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('/');
          if (!isSafe) {
            element.removeAttribute('href');
          } else {
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', 'noopener noreferrer');
          }
        }

        if (tagName === 'IMG') {
          const src = element.getAttribute('src') ?? '';
          const isSafeImage =
            src.startsWith('http://') ||
            src.startsWith('https://') ||
            src.startsWith('/');
          if (!isSafeImage) {
            node.removeChild(element);
            continue;
          }
        }

        walk(element);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
      }
    }
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', active && 'bg-primary/15 text-primary')}
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}

function insertLink(editor: Editor | null): void {
  if (!editor) return;
  const existing = editor.getAttributes('link').href as string | undefined;
  const value = window.prompt('请输入链接地址（https://）', existing ?? 'https://');
  if (value === null) return;

  const url = value.trim();
  if (!url) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  const normalized = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  editor.chain().focus().setLink({ href: normalized }).run();
}

function insertImage(editor: Editor | null): void {
  if (!editor) return;
  const srcValue = window.prompt('请输入图片 URL');
  if (srcValue === null) return;
  const src = srcValue.trim();
  if (!src) return;

  const altValue = window.prompt('请输入图片 ALT 文本（可选）') ?? '';
  editor
    .chain()
    .focus()
    .setImage({ src, alt: altValue.trim() || undefined })
    .run();
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  disabled = false,
  className,
}: RichTextEditorProps) {
  const sanitizedInitial = useMemo(() => sanitizeHtml(value), [value]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
    ],
    content: sanitizedInitial,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'admin-rich-editor min-h-[260px] w-full rounded-b-md px-4 py-3 text-sm focus:outline-none',
      },
    },
    onUpdate({ editor: current }) {
      const html = sanitizeHtml(current.getHTML());
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = sanitizeHtml(editor.getHTML());
    const next = sanitizeHtml(value);
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className={cn('rounded-md border border-border/60 bg-card', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/20 p-2">
        <ToolbarButton
          label="加粗"
          icon={<Bold className="h-4 w-4" />}
          active={editor?.isActive('bold')}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="斜体"
          icon={<Italic className="h-4 w-4" />}
          active={editor?.isActive('italic')}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="下划线"
          icon={<UnderlineIcon className="h-4 w-4" />}
          active={editor?.isActive('underline')}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="H2"
          icon={<Heading2 className="h-4 w-4" />}
          active={editor?.isActive('heading', { level: 2 })}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          icon={<Heading3 className="h-4 w-4" />}
          active={editor?.isActive('heading', { level: 3 })}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label="H4"
          icon={<Heading4 className="h-4 w-4" />}
          active={editor?.isActive('heading', { level: 4 })}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
        />
        <ToolbarButton
          label="无序列表"
          icon={<List className="h-4 w-4" />}
          active={editor?.isActive('bulletList')}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="有序列表"
          icon={<ListOrdered className="h-4 w-4" />}
          active={editor?.isActive('orderedList')}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="引用"
          icon={<Quote className="h-4 w-4" />}
          active={editor?.isActive('blockquote')}
          disabled={!editor || disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          label="链接"
          icon={<LinkIcon className="h-4 w-4" />}
          active={editor?.isActive('link')}
          disabled={!editor || disabled}
          onClick={() => insertLink(editor)}
        />
        <ToolbarButton
          label="图片"
          icon={<ImageIcon className="h-4 w-4" />}
          disabled={!editor || disabled}
          onClick={() => insertImage(editor)}
        />
        <ToolbarButton
          label="插入表格"
          icon={<TableIcon className="h-4 w-4" />}
          disabled={!editor || disabled}
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        />
      </div>
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-[260px] px-4 py-3 text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  );
}
