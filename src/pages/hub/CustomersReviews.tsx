import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';

export default function CustomersReviews() {
  return (
    <AppSurface>
      <BackBar to="/hub/customers" label="Back to Customers" />
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Reviews</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </AppSurface>
  );
}
