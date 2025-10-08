import { useHubBranding } from '@/hooks/useHubBranding';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getDeterministicGradient, getInitials } from '@/hooks/useHubBranding';

export default function HubBrandStrip() {
  const { name, tagline, logoUrl, isLoading } = useHubBranding();

  if (isLoading) {
    return (
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full ring-2 ring-white/70 shadow-md bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const initials = getInitials(name);
  const gradient = getDeterministicGradient(name);

  return (
    <div className="px-4 pt-3 pb-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-white/70 dark:ring-white/20 shadow-md">
          {logoUrl ? (
            <AvatarImage src={logoUrl} alt={`${name} logo`} />
          ) : null}
          <AvatarFallback 
            className="font-semibold text-white text-base"
            style={{
              background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold leading-tight text-foreground truncate">
            {name}
          </div>
          <div className="text-sm text-muted-foreground leading-tight">
            Let's turn your idea into income. Start with one quick action.
          </div>
        </div>
      </div>
    </div>
  );
}
