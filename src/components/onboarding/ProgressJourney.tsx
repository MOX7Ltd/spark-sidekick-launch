type StepKey = 'idea' | 'identity' | 'brand' | 'launch';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'idea', label: 'Your Idea' },
  { key: 'identity', label: 'About You' },
  { key: 'brand', label: 'Create Your Brand' },
  { key: 'launch', label: 'Launch' },
];

interface ProgressJourneyProps {
  current: StepKey;
}

export function ProgressJourney({ current }: ProgressJourneyProps) {
  const currentIndex = STEPS.findIndex(s => s.key === current);
  
  return (
    <nav className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-3">
          {STEPS.map((s, i) => {
            const active = s.key === current;
            const done = currentIndex > i;
            const future = currentIndex < i;
            
            return (
              <li key={s.key} className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                <div className={`h-8 px-3 rounded-full text-xs sm:text-sm flex items-center gap-1.5 transition-colors font-medium
                  ${active ? 'bg-primary/10 text-primary ring-2 ring-primary/20' : 
                    done ? 'bg-emerald-50 text-emerald-600' : 
                    'bg-muted text-muted-foreground'}`}
                >
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs
                    ${active ? 'bg-primary text-primary-foreground' : 
                      done ? 'bg-emerald-500 text-white' : 
                      'bg-muted-foreground/20 text-muted-foreground'}`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`hidden sm:block w-6 h-[2px] transition-colors
                    ${done ? 'bg-emerald-300' : 'bg-border'}`} 
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

// Helper to map step numbers to keys
export function getStepKey(stepNumber: number, context?: { bioLocked?: boolean }): StepKey {
  if (stepNumber <= 1) return 'idea';
  // Step 2 encompasses all "About You" sub-steps until bio is locked
  if (stepNumber === 2 || (stepNumber === 3 && !context?.bioLocked)) return 'identity';
  if (stepNumber <= 4) return 'brand';
  return 'launch';
}
