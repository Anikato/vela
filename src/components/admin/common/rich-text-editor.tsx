'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import Youtube from '@tiptap/extension-youtube';
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
  Video,
  Paperclip,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Media } from '@/types/admin';
import { MediaPickerDialog } from '@/components/admin/common/media-picker-dialog';

type MediaWithUrl = Media & { url: string };

type AttachmentItem = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
};

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mediaItems?: MediaWithUrl[];
  onMediaUploaded?: (items: MediaWithUrl[]) => void;
  attachments?: AttachmentItem[];
  toolbarExtras?: ReactNode | ((editor: Editor | null) => ReactNode);
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
    'IFRAME',
    'DIV',
  ]);

  const ALLOWED_IFRAME_HOSTS = [
    'www.youtube-nocookie.com',
    'www.youtube.com',
    'youtube.com',
    'player.vimeo.com',
  ];

  const allowedAttrs: Record<string, Set<string>> = {
    A: new Set(['href', 'target', 'rel']),
    IMG: new Set(['src', 'alt']),
    TH: new Set(['colspan', 'rowspan']),
    TD: new Set(['colspan', 'rowspan']),
    IFRAME: new Set(['src', 'width', 'height', 'allowfullscreen', 'allow', 'frameborder', 'title', 'style']),
    DIV: new Set(['data-youtube-video', 'style', 'class']),
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

        if (tagName === 'IFRAME') {
          const src = element.getAttribute('src') ?? '';
          try {
            const url = new URL(src);
            if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
              node.removeChild(element);
              continue;
            }
          } catch {
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

function insertYouTube(editor: Editor | null): void {
  if (!editor) return;
  const url = window.prompt('请输入 YouTube 或 Vimeo 视频链接');
  if (!url?.trim()) return;

  editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  disabled = false,
  className,
  mediaItems,
  onMediaUploaded,
  attachments,
  toolbarExtras,
}: RichTextEditorProps) {
  const sanitizedInitial = useMemo(() => sanitizeHtml(value), [value]);

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);

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
      Youtube.configure({
        inline: false,
        nocookie: true,
      }),
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

  function handleImageClick() {
    if (mediaItems) {
      setImagePickerOpen(true);
    } else {
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
  }

  function handleImageSelected(ids: string[]) {
    if (!editor || !mediaItems) return;
    for (const id of ids) {
      const item = mediaItems.find((m) => m.id === id);
      if (item) {
        editor.chain().focus().setImage({ src: item.url, alt: item.alt ?? item.originalName }).run();
      }
    }
  }

  function handleInsertAttachment(item: AttachmentItem) {
    if (!editor) return;
    const icon = item.mimeType.startsWith('image/') ? '🖼️' : '📄';
    const html = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${icon} ${item.name}</a>`;
    editor.chain().focus().insertContent(html).run();
    setAttachmentDialogOpen(false);
  }

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
          onClick={handleImageClick}
        />
        <ToolbarButton
          label="嵌入视频"
          icon={<Video className="h-4 w-4" />}
          disabled={!editor || disabled}
          onClick={() => insertYouTube(editor)}
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
        {attachments && attachments.length > 0 && (
          <ToolbarButton
            label="插入附件"
            icon={<Paperclip className="h-4 w-4" />}
            disabled={!editor || disabled}
            onClick={() => setAttachmentDialogOpen(true)}
          />
        )}
        {typeof toolbarExtras === 'function' ? toolbarExtras(editor) : toolbarExtras}
      </div>
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-[260px] px-4 py-3 text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}

      {mediaItems && (
        <MediaPickerDialog
          open={imagePickerOpen}
          onOpenChange={setImagePickerOpen}
          mediaItems={mediaItems}
          onMediaUploaded={onMediaUploaded ?? (() => {})}
          onConfirm={handleImageSelected}
          multiple
          accept="image"
          title="选择图片插入描述"
        />
      )}

      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>插入附件链接</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-auto">
            {attachments?.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border/50 p-3 text-left text-sm transition-colors hover:bg-accent"
                onClick={() => handleInsertAttachment(item)}
              >
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
