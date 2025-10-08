import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';

interface LinksSectionProps {
  links: Array<{ label: string; url: string }>;
  onLinksChange: (links: Array<{ label: string; url: string }>) => void;
}

export function LinksSection({ links, onLinksChange }: LinksSectionProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addLink = () => {
    if (newLabel.trim() && newUrl.trim()) {
      onLinksChange([...links, { label: newLabel.trim(), url: newUrl.trim() }]);
      setNewLabel('');
      setNewUrl('');
    }
  };

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>External Resources</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add links to Zoom, Google Drive, demo videos, etc.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g., Demo Video)"
          />
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <Button type="button" onClick={addLink} variant="outline" size="sm" className="w-full">
          + Add Link
        </Button>
      </div>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/50 border border-white/30 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{link.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(index)}
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
