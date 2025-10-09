import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';

export default function ProfileBusiness() {
  return (
    <AppSurface>
      <BackBar to="/hub/profile" label="Back to Profile" />
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Business Profile</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </AppSurface>
  );
}
