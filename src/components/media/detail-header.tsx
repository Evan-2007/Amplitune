import Link from 'next/link';
import { Artwork } from './artwork';
import { SourceBadges } from './source-badges';

/** Cover, title and actions at the top of an album, playlist or track page. */
export function DetailHeader({
  label,
  title,
  image,
  artist,
  artistHref,
  meta,
  sources,
  children,
}: {
  /** What this is: "Album", "Playlist", "Song" */
  label: string;
  title: string;
  image?: string;
  artist?: string;
  artistHref?: string;
  /** Secondary line such as genre, year and length */
  meta?: React.ReactNode;
  sources?: string[];
  /** Action buttons */
  children?: React.ReactNode;
}) {
  return (
    <div className='flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left'>
      <Artwork
        src={image}
        alt={title}
        kind={label === 'Song' ? 'track' : 'album'}
        className='h-52 w-52 !rounded-xl shadow-lg'
      />
      <div className='flex min-w-0 flex-1 flex-col max-sm:items-center'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <h1 className='line-clamp-3 text-3xl font-bold md:text-4xl'>{title}</h1>
        {artist &&
          (artistHref ? (
            <Link href={artistHref} className='mt-1 text-lg hover:underline'>
              {artist}
            </Link>
          ) : (
            <p className='mt-1 text-lg'>{artist}</p>
          ))}
        {meta && <p className='mt-1 text-sm text-muted-foreground'>{meta}</p>}
        <div className='mt-4 flex w-full flex-wrap items-center justify-between gap-3 max-sm:justify-center'>
          {children}
          <SourceBadges sources={sources} />
        </div>
      </div>
    </div>
  );
}
