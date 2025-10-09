import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  preview?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  accept = '.png,.jpg,.jpeg,.svg',
  maxSizeMB = 5,
  className,
  preview = true,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }

    setError(null);

    // Create preview
    if (preview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    onChange(file);
  };

  const handleClear = () => {
    setPreviewUrl(undefined);
    setError(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="image-uploader"
      />

      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-muted w-full aspect-square max-w-[200px]">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full shadow-lg"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="image-uploader"
          className="flex flex-col items-center justify-center w-full aspect-square max-w-[200px] border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary transition-colors bg-muted/30"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground text-center px-4">
            Tap to upload
            <br />
            <span className="text-xs">Max {maxSizeMB}MB</span>
          </span>
        </label>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
