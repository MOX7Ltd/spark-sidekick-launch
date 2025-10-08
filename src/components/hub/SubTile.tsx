import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SubTileProps {
  to: string;
  icon: ReactNode;
  title: string;
  desc: string;
  variant?: 'lab' | 'card' | 'mini';
  badge?: string;
  onClick?: () => void;
  delay?: number;
  accentBorder?: boolean;
}

export function SubTile({ 
  to, 
  icon, 
  title, 
  desc, 
  variant = 'card', 
  badge,
  onClick,
  delay = 0,
  accentBorder = false
}: SubTileProps) {
  const baseClasses = cn(
    "block rounded-2xl min-h-[44px]",
    "transition-all duration-200",
    "active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
  );

  const labClasses = cn(
    "bg-gradient-to-br from-[hsl(var(--sh-cta-from))] to-[hsl(var(--sh-cta-to))]",
    "text-white shadow-lg hover:brightness-105",
    "p-4 md:p-5"
  );

  const cardClasses = cn(
    "backdrop-blur-md bg-white/75 dark:bg-card/75",
    "border border-white/30 dark:border-white/10",
    "shadow-lg hover:shadow-xl",
    "p-4",
    accentBorder && "border-l-4 border-l-[hsl(var(--sh-teal-500))]"
  );

  const miniClasses = cn(
    "backdrop-blur-md bg-white/75 dark:bg-card/75",
    "border border-white/30 dark:border-white/10",
    "shadow-lg hover:shadow-xl",
    "p-3"
  );

  const variantClasses = {
    lab: labClasses,
    card: cardClasses,
    mini: miniClasses
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: variant === 'lab' ? 0.98 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link
        to={to}
        onClick={onClick}
        className={cn(baseClasses, variantClasses[variant])}
      >
        <div className={cn(
          "flex items-start gap-3",
          variant === 'mini' && "flex-col"
        )}>
          <div className={cn(
            "inline-flex items-center justify-center rounded-full shrink-0",
            variant === 'lab' 
              ? "h-10 w-10 bg-white/15 ring-1 ring-white/30" 
              : "h-9 w-9 bg-gradient-to-br from-[hsl(var(--sh-teal-500))] to-[hsl(var(--sh-orange-500))] text-white"
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-base",
                variant === 'lab' ? 'text-white' : 'text-foreground',
                variant === 'mini' && "text-sm"
              )}>
                {title}
              </h3>
              {badge && (
                <span className="inline-flex items-center bg-white/20 text-white/90 rounded-full px-2 py-0.5 text-xs font-medium">
                  {badge}
                </span>
              )}
            </div>
            <p className={cn(
              "text-sm leading-tight",
              variant === 'lab' ? 'text-white/90' : 'text-muted-foreground',
              variant === 'mini' && "text-xs"
            )}>
              {desc}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
