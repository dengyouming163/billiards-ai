'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  type?: 'product' | 'avatar' | 'general';
  accept?: string;
  maxSize?: number; // MB
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function ImageUpload({
  value,
  onChange,
  type = 'general',
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSize = 5,
  placeholder = '点击上传图片',
  aspectRatio = 'square',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`图片大小不能超过 ${maxSize}MB`);
      return;
    }

    // 验证文件类型
    const allowedTypes = accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      setError('不支持的图片格式');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.code !== 1) {
        throw new Error(result.msg || '上传失败');
      }

      const url = result.data?.url || '';
      setPreview(url);
      onChange?.(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange?.('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className={`relative ${aspectRatioClass[aspectRatio]} w-full rounded-lg overflow-hidden bg-slate-800`}>
          <img
            src={preview}
            alt="预览"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`${aspectRatioClass[aspectRatio]} w-full rounded-lg border-2 border-dashed border-slate-600 hover:border-slate-500 transition-colors cursor-pointer flex flex-col items-center justify-center p-4 bg-slate-800/50`}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
              <p className="text-sm text-slate-400">上传中...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-400">{placeholder}</p>
              <p className="text-xs text-slate-500 mt-1">支持 JPG、PNG、WebP，最大 {maxSize}MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
