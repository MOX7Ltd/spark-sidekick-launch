import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';

export default function SocialLab() {
  return (
    <AppSurface>
      <BackBar to="/hub/social" label="Back to Social" />
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Social Lab</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </AppSurface>
  );
}
