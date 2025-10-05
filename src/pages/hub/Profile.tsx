import { Edit, User } from 'lucide-react';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';

export default function Profile() {
  return (
    <div>
      <SectionHeader
        title="Your Business Profile"
        subtitle="Name, logo, bio, and brand colors that customers see."
        primaryAction={{
          label: 'Edit Identity',
          icon: Edit,
          onClick: () => console.log('Edit identity'),
        }}
      />

      <EmptyState
        icon={User}
        title="No profile set up yet"
        description="Complete your business identity to get started."
      />
    </div>
  );
}
