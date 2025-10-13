import { AppSurface } from '@/components/layout/AppSurface';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default function OnboardingFinal() {
  return (
    <AppSurface>
      <OnboardingFlow initialStep={7} />
    </AppSurface>
  );
}
