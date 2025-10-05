import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface CreateProfileBannerProps {
  show: boolean;
}

export const CreateProfileBanner = ({ show }: CreateProfileBannerProps) => {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 via-orange-500/10 to-primary/10 border-primary/20 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Let's set up your brand</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your profile so your shopfront looks great and customers can find you.
          </p>
          <Button
            onClick={() => navigate('/hub/create-profile')}
            className="bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
          >
            Create My Profile
          </Button>
        </div>
      </div>
    </Card>
  );
};
