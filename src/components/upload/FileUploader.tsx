import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, FileIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  userId: string;
  productId: string;
  existingFiles?: Array<{ url: string; name: string; size: number }>;
  onFilesChange: (files: Array<{ url: string; name: string; size: number }>) => void;
}

export function FileUploader({ userId, productId, existingFiles = [], onFilesChange }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState(existingFiles);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const newFiles: Array<{ url: string; name: string; size: number }> = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${productId}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-assets')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-assets')
          .getPublicUrl(filePath);

        newFiles.push({
          url: publicUrl,
          name: file.name,
          size: file.size,
        });
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      toast.success(`Uploaded ${newFiles.length} file(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="relative"
          asChild
        >
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Files'}
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="sr-only"
              accept=".pdf,.zip,.mp4,.mov,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
          </label>
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/50 border border-white/30 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
