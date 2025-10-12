import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The link has been copied successfully.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
      });
    }
  };

  return { copy, copied };
}
