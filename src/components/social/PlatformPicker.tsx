import { Badge } from '@/components/ui/badge';
import { ALL_PLATFORMS, PLATFORM_ICONS, Platform } from '@/lib/socialLab';
import { cn } from '@/lib/utils';

interface PlatformPickerProps {
  selected: Platform[];
  onChange: (platforms: Platform[]) => void;
  className?: string;
}

export function PlatformPicker({ selected, onChange, className }: PlatformPickerProps) {
  const toggle = (platform: Platform) => {
    if (selected.includes(platform)) {
      onChange(selected.filter(p => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  return (
    <div className={cn("sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4", className)}>
      <p className="text-sm text-muted-foreground mb-2">Select platforms:</p>
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform);
          return (
            <Badge
              key={platform}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all min-h-[44px] px-4",
                isSelected && "bg-gradient-to-r from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))] text-white border-0"
              )}
              onClick={() => toggle(platform)}
            >
              <span className="mr-1">{PLATFORM_ICONS[platform]}</span>
              {platform}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
