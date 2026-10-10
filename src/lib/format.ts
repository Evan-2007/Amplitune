import { Song } from '@/lib/sources/types';

/** `3:07` from a length in milliseconds. */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '';
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** `42 min` or `1 hr 12 min` for the combined length of a track list. */
export function formatTotalDuration(songs: Song[]): string {
  const minutes = Math.round(
    songs.reduce((total, song) => total + (song.duration || 0), 0) / 60000
  );
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

/** Sources report either a full date or only a year. */
export function formatYear(releaseDate?: string): string {
  const year = (releaseDate ?? '').slice(0, 4);
  return /^\d{4}$/.test(year) ? year : '';
}

export function formatReleaseDate(releaseDate?: string): string {
  if (!releaseDate) return '';
  if (!/^\d{4}-\d{2}-\d{2}/.test(releaseDate)) return formatYear(releaseDate);
  // Parsed as local time so the day does not shift across time zones
  const [year, month, day] = releaseDate.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Joins the parts that exist with a middle dot. */
export function joinMeta(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' · ');
}

export function albumHref(id: string, source: string): string {
  return `/home/album?id=${encodeURIComponent(id)}&source=${source}`;
}

export function artistHref(id: string, source: string): string {
  return `/home/artist?id=${encodeURIComponent(id)}&source=${source}`;
}

/**
 * Only ids go in the route; the page fetches the rest. `sources` carries the
 * track's id in its other sources so a merged result keeps them.
 */
export function trackHref(song: Song): string {
  const base = `/home/track?id=${encodeURIComponent(song.id)}&source=${song.source}`;
  const others = Object.keys(song.sourceIds ?? {}).length > 1;
  return others
    ? `${base}&sources=${encodeURIComponent(JSON.stringify(song.sourceIds))}`
    : base;
}
