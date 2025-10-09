import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  notes?: string;
}

interface MediaPickerProps {
  assets: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
  campaignId: string;
  itemId: string;
}

export function MediaPicker({ assets, onChange, campaignId, itemId }: MediaPickerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAssets: MediaAsset[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${campaignId}/${itemId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('campaign-media')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('campaign-media')
          .getPublicUrl(data.path);

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        newAssets.push({
          id: crypto.randomUUID(),
          url: urlData.publicUrl,
          type
        });
      }

      onChange([...assets, ...newAssets]);
      toast({ title: 'Media uploaded successfully' });
    } catch (error: any) {
      console.error('[MediaPicker] Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    onChange(assets.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="relative group rounded-lg overflow-hidden border border-border bg-muted w-24 h-24"
          >
            {asset.type === 'image' ? (
              <img src={asset.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => handleRemove(asset.id)}
              className="absolute top-1 right-1 p-1 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <label>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleUpload}
          disabled={isUploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          className="w-full"
          asChild
        >
          <span>
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}
