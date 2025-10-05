import { Plus, Package } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';

export default function Products() {
  return (
    <div>
      <SectionHeader
        title="Products"
        subtitle="Everything you created in onboarding is ready to edit here."
        primaryAction={{
          label: 'Create Product',
          icon: Plus,
          onClick: () => console.log('Create product'),
        }}
      />

      <EmptyState
        icon={Package}
        title="No products yet"
        description="Start by creating your first product."
      />
    </div>
  );
}
