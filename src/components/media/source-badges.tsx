import { cn } from '@/lib/utils';

export const SOURCE_NAMES: Record<string, string> = {
  navidrome: 'Navidrome',
  musicKit: 'Apple Music',
  tidal: 'Tidal',
};

const SOURCE_STYLES: Record<string, string> = {
  navidrome: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  musicKit: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  tidal: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
};

export function SourceBadge({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium leading-none',
        SOURCE_STYLES[source] ?? 'bg-muted text-muted-foreground',
        className
      )}
    >
      {SOURCE_NAMES[source] ?? source}
    </span>
  );
}

/** One badge per source an item is available from. */
export function SourceBadges({
  sources,
  className,
}: {
  sources?: string[];
  className?: string;
}) {
  if (!sources?.length) return null;
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {sources.map((source) => (
        <SourceBadge key={source} source={source} />
      ))}
    </div>
  );
}
