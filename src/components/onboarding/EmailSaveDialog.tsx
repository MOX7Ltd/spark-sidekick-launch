import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';
import { useToast } from '@/hooks/use-toast';

interface EmailSaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (email: string) => void;
}

export function EmailSaveDialog({ open, onClose, onSaved }: EmailSaveDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const sessionId = getSessionId();
      
      if (email && email.includes('@')) {
        // Save email to preauth profile using direct insert/upsert
        const { error: insertError } = await supabase
          .from('preauth_profiles')
          .upsert({ 
            email: email.toLowerCase(), 
            session_id: sessionId,
            last_seen_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
        
        if (insertError) {
          console.error('Failed to save pre-auth profile:', insertError);
        }
        
        // Update onboarding session hint
        const { error: sessionError } = await supabase
          .from('onboarding_sessions')
          .update({ user_hint_email: email.toLowerCase() })
          .eq('session_id', sessionId);
        
        if (sessionError) {
          console.error('Failed to update session email:', sessionError);
        }
        
        toast({
          title: 'Progress saved',
          description: 'We\'ll send you a reminder to finish your setup.',
        });
        
        onSaved?.(email);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save email:', error);
      toast({
        title: 'Could not save',
        description: 'No worries—your progress is still saved locally.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save your progress</DialogTitle>
          <DialogDescription>
            Enter your email so you can pick up where you left off anytime.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !email}>
            {isLoading ? 'Saving...' : 'Save Progress'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
