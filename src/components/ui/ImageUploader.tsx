import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  value?: string;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUploader({ 
  value, 
  onChange, 
  accept = '.png,.jpg,.jpeg,.svg',
  maxSizeMB = 5 
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File too large (max ${maxSizeMB}MB)`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleClear = () => {
    setPreview(undefined);
    setError('');
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {preview ? (
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden ring-2 ring-border">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-32 h-32 rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-8 w-8 text-muted-foreground" />
          </label>
        )}
      </div>
      
      {!preview && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
        >
          Choose Image
        </Button>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
