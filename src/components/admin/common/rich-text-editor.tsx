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
import TiptapImage from '@tiptap/extension-image';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
    'SVG',
    'PATH',
    'SPAN',
  ]);

  const ALLOWED_IFRAME_HOSTS = [
    'www.youtube-nocookie.com',
    'www.youtube.com',
    'youtube.com',
    'player.vimeo.com',
  ];

  const allowedAttrs: Record<string, Set<string>> = {
    A: new Set(['href', 'target', 'rel', 'class', 'download']),
    IMG: new Set(['src', 'alt', 'width', 'height', 'style']),
    TABLE: new Set(['style']),
    TH: new Set(['colspan', 'rowspan', 'style']),
    TD: new Set(['colspan', 'rowspan', 'style']),
    IFRAME: new Set(['src', 'width', 'height', 'allowfullscreen', 'allow', 'frameborder', 'title', 'style']),
    DIV: new Set(['data-youtube-video', 'style', 'class']),
    SVG: new Set(['xmlns', 'viewbox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'class', 'style']),
    PATH: new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']),
    SPAN: new Set(['class', 'style']),
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

const LINK_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';

const DOWNLOAD_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>';

const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('height'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

const VIDEO_WIDTH_PRESETS = [
  { label: '小 (480px)', value: 480 },
  { label: '中 (640px)', value: 640 },
  { label: '大 (100%)', value: 0 },
] as const;

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
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentItem | null>(null);
  const [attachmentDisplayText, setAttachmentDisplayText] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageSizeDialogOpen, setImageSizeDialogOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [imageWidth, setImageWidth] = useState('');
  const [editingImageMode, setEditingImageMode] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoWidth, setVideoWidth] = useState(0);

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
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
      }),
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
      handleClickOn(_view, _pos, node) {
        if (node.type.name === 'image') {
          const src = node.attrs.src as string;
          const alt = (node.attrs.alt as string) || '';
          const w = node.attrs.width as string | null;
          setPendingImages([{ src, alt }]);
          setImageWidth(w ?? '');
          setEditingImageMode(true);
          setImageSizeDialogOpen(true);
          return true;
        }
        return false;
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
    const images = ids
      .map((id) => mediaItems.find((m) => m.id === id))
      .filter(Boolean)
      .map((item) => ({ src: item!.url, alt: item!.alt ?? item!.originalName }));
    if (images.length === 0) return;
    setPendingImages(images);
    setImageWidth('');
    setImageSizeDialogOpen(true);
  }

  function handleConfirmImageInsert() {
    if (!editor) return;
    const w = imageWidth.trim();
    const widthVal = w ? parseInt(w, 10) : null;

    if (editingImageMode && pendingImages.length === 1) {
      const img = pendingImages[0];
      const attrs: Record<string, unknown> = { src: img.src, alt: img.alt };
      if (widthVal && widthVal > 0) {
        attrs.width = String(widthVal);
        attrs.style = `width:${widthVal}px;max-width:100%;height:auto`;
      } else {
        attrs.width = null;
        attrs.style = null;
      }
      editor.chain().focus().updateAttributes('image', attrs).run();
    } else {
      for (const img of pendingImages) {
        const attrs: Record<string, unknown> = { src: img.src, alt: img.alt };
        if (widthVal && widthVal > 0) {
          attrs.width = String(widthVal);
          attrs.style = `width:${widthVal}px;max-width:100%;height:auto`;
        }
        editor.chain().focus().setImage(attrs as { src: string; alt?: string }).run();
      }
    }
    setImageSizeDialogOpen(false);
    setPendingImages([]);
    setEditingImageMode(false);
  }

  function handleSelectAttachment(item: AttachmentItem) {
    setSelectedAttachment(item);
    setAttachmentDisplayText(item.name);
  }

  function handleConfirmAttachment() {
    if (!editor || !selectedAttachment) return;
    const displayText = attachmentDisplayText.trim() || selectedAttachment.name;
    const html = `<a href="${selectedAttachment.url}" target="_blank" rel="noopener noreferrer" class="rte-download-link">${DOWNLOAD_ICON_SVG}${displayText}</a>`;
    editor.chain().focus().insertContent(html).run();
    setAttachmentDialogOpen(false);
    setSelectedAttachment(null);
    setAttachmentDisplayText('');
  }

  function openLinkDialog() {
    if (!editor) return;
    const existing = editor.getAttributes('link').href as string | undefined;
    const { from, to } = editor.state.selection;
    const selectedText = from !== to ? editor.state.doc.textBetween(from, to, '') : '';
    setLinkUrl(existing ?? 'https://');
    setLinkText(selectedText);
    setLinkDialogOpen(true);
  }

  function handleInsertLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
      setLinkDialogOpen(false);
      return;
    }
    const normalized = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') ? url : `https://${url}`;
    const displayText = linkText.trim() || normalized;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      editor.chain().focus().setLink({ href: normalized }).run();
    } else {
      const html = `<a href="${normalized}" target="_blank" rel="noopener noreferrer">${LINK_ICON_SVG}${displayText}</a>`;
      editor.chain().focus().insertContent(html).run();
    }
    setLinkDialogOpen(false);
  }

  function openVideoDialog() {
    setVideoUrl('');
    setVideoWidth(0);
    setVideoDialogOpen(true);
  }

  function handleInsertVideo() {
    if (!editor) return;
    const url = videoUrl.trim();
    if (!url) return;
    const opts: { src: string; width?: number; height?: number } = { src: url };
    if (videoWidth > 0) {
      opts.width = videoWidth;
      opts.height = Math.round(videoWidth * 9 / 16);
    }
    editor.chain().focus().setYoutubeVideo(opts).run();
    setVideoDialogOpen(false);
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
          onClick={openLinkDialog}
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
          onClick={openVideoDialog}
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

      <Dialog open={attachmentDialogOpen} onOpenChange={(open) => {
        setAttachmentDialogOpen(open);
        if (!open) { setSelectedAttachment(null); setAttachmentDisplayText(''); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>插入附件链接</DialogTitle>
          </DialogHeader>
          {!selectedAttachment ? (
            <div className="max-h-72 space-y-2 overflow-auto">
              {attachments?.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-border/50 p-3 text-left text-sm transition-colors hover:bg-accent"
                  onClick={() => handleSelectAttachment(item)}
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3 text-sm">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedAttachment.name}</span>
                <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setSelectedAttachment(null)}>
                  重新选择
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="att-display-text">显示文本</Label>
                <Input
                  id="att-display-text"
                  value={attachmentDisplayText}
                  onChange={(e) => setAttachmentDisplayText(e.target.value)}
                  placeholder="如：点击下载产品规格书"
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmAttachment()}
                />
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">预览</p>
                <span className="inline-flex items-center gap-1 text-primary underline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                  {attachmentDisplayText.trim() || selectedAttachment.name}
                </span>
              </div>
            </div>
          )}
          {selectedAttachment && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAttachmentDialogOpen(false); setSelectedAttachment(null); }}>
                取消
              </Button>
              <Button onClick={handleConfirmAttachment}>
                插入
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">链接地址</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">显示文本（可选）</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="留空则显示链接地址"
                onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleInsertLink}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageSizeDialogOpen} onOpenChange={(open) => {
        if (!open) { setPendingImages([]); setEditingImageMode(false); }
        setImageSizeDialogOpen(open);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingImageMode ? '调整图片尺寸' : '设置图片尺寸'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingImageMode && pendingImages[0] && (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-2">
                <img src={pendingImages[0].src} alt="" className="max-h-32 rounded object-contain" />
              </div>
            )}
            {!editingImageMode && (
              <p className="text-sm text-muted-foreground">
                已选择 {pendingImages.length} 张图片，可设置统一宽度（留空则使用原始尺寸）
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="img-width">宽度（像素）</Label>
              <Input
                id="img-width"
                type="number"
                min={50}
                max={2000}
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                placeholder="如 600，留空为原始大小"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmImageInsert()}
              />
              <p className="text-[11px] text-muted-foreground">高度会按比例自动计算，最大不超过容器宽度</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImageSizeDialogOpen(false); setPendingImages([]); setEditingImageMode(false); }}>
              取消
            </Button>
            <Button onClick={handleConfirmImageInsert}>
              {editingImageMode ? '应用' : '插入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>嵌入视频</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">视频链接</Label>
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="粘贴 YouTube 或 Vimeo 链接"
                onKeyDown={(e) => e.key === 'Enter' && handleInsertVideo()}
              />
            </div>
            <div className="space-y-2">
              <Label>视频尺寸</Label>
              <div className="flex gap-2">
                {VIDEO_WIDTH_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={videoWidth === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVideoWidth(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                选择「大」会自适应容器宽度（推荐），选择固定尺寸可精确控制视频大小
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleInsertVideo} disabled={!videoUrl.trim()}>
              插入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
