'use client';

import { useCallback, useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import type { Media } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { MediaPickerDialog } from './media-picker-dialog';

type MediaWithUrl = Media & { url: string };

interface ImagePickerUploadProps {
  label: string;
  currentUrl: string | null;
  mediaItems: MediaWithUrl[];
  onSelect: (id: string, url: string) => void;
  onClear: () => void;
  onMediaUploaded?: (items: MediaWithUrl[]) => void;
}

export function ImagePickerUpload({
  label,
  currentUrl,
  mediaItems,
  onSelect,
  onClear,
  onMediaUploaded,
}: ImagePickerUploadProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDirectUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = (await response.json()) as
          | { success: true; data: MediaWithUrl }
          | { success: false; error: string };

        if (!response.ok || !result.success) {
          toast.error('success' in result && !result.success ? result.error : '上传失败');
          return;
        }

        onSelect(result.data.id, result.data.url);
        onMediaUploaded?.([result.data]);
        toast.success('图片已上传');
      } catch {
        toast.error('上传失败');
      } finally {
        setIsUploading(false);
      }
    },
    [onSelect, onMediaUploaded],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleDirectUpload(file);
      e.target.value = '';
    },
    [handleDirectUpload],
  );

  const handlePickerConfirm = useCallback(
    (selectedIds: string[]) => {
      const id = selectedIds[0];
      if (!id) return;
      const item = mediaItems.find((m) => m.id === id);
      if (item) {
        onSelect(item.id, item.url);
      }
    },
    [mediaItems, onSelect],
  );

  const handlePickerUpload = useCallback(
    (items: MediaWithUrl[]) => {
      onMediaUploaded?.(items);
    },
    [onMediaUploaded],
  );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
            <img src={currentUrl} alt="" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={onClear}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isUploading ? '上传中…' : '上传图片'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPickerOpen(true)}
            disabled={isUploading}
          >
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
            从媒体库选择
          </Button>
        </div>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mediaItems={mediaItems}
        onMediaUploaded={handlePickerUpload}
        onConfirm={handlePickerConfirm}
        multiple={false}
        accept="image"
        title={`选择${label}`}
      />
    </div>
  );
}
