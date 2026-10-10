'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAlbumData } from '@/lib/hooks';
import { useQueueStore } from '@/lib/queue';
import { SourceManager } from '@/lib/sources/source-manager';
import { AlbumData, AlbumSummary } from '@/lib/sources/types';
import {
  artistHref,
  formatReleaseDate,
  formatTotalDuration,
  formatYear,
  joinMeta,
  pluralize,
} from '@/lib/format';
import { DetailHeader } from '@/components/media/detail-header';
import { TrackRow } from '@/components/media/track-row';
import { AlbumCard, MediaGrid, Section } from '@/components/media/media-card';
import { PlayActions } from '@/components/media/play-actions';
import {
  DetailSkeleton,
  ExpandableText,
  PageBody,
  PageError,
} from '@/components/media/page-state';

const MORE_BY_SHOWN = 6;

export default function Page() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AlbumPage />
    </Suspense>
  );
}

function AlbumPage() {
  const { data: album, loading, error, retry } = useAlbumData();

  if (loading) return <DetailSkeleton />;
  if (error || !album) {
    return (
      <PageError
        title="Couldn't load this album"
        error={error}
        onRetry={retry}
      />
    );
  }
  return <Album album={album} />;
}

function Album({ album }: { album: AlbumData }) {
  const playAlbum = useQueueStore((state) => state.playAlbum);
  const tracks = album.tracks ?? [];
  const artistLink = album.artistId
    ? artistHref(album.artistId, album.source)
    : undefined;
  // Apple's notes come with inline HTML
  const notes = (
    album.editorialNotes?.standard ??
    album.editorialNotes?.short ??
    ''
  )
    .replace(/<[^>]*>/g, '')
    .trim();
  const length = joinMeta(
    tracks.length > 0 && pluralize(tracks.length, 'track'),
    formatTotalDuration(tracks)
  );

  return (
    <PageBody>
      <DetailHeader
        label={album.isSingle ? 'Single' : 'Album'}
        title={album.name}
        image={album.artWork?.url}
        artist={album.artist}
        artistHref={artistLink}
        meta={joinMeta(
          album.genres?.find((genre) => genre !== 'Music'),
          formatYear(album.releaseDate),
          length
        )}
        sources={[album.source]}
      >
        <PlayActions songs={tracks} />
      </DetailHeader>

      {notes && <ExpandableText text={notes} className='mt-6' />}

      <div className='-mx-2 mt-6 flex flex-col border-t border-border pt-2'>
        {tracks.length === 0 ? (
          <p className='px-2 py-6 text-sm text-muted-foreground'>
            This album has no tracks available.
          </p>
        ) : (
          tracks.map((song, index) => (
            <TrackRow
              key={song.id}
              song={song}
              number={song.trackNumber ?? index + 1}
              showArtwork={false}
              subtitle={song.artist !== album.artist ? song.artist : undefined}
              // Keeps what is queued and carries on through the album
              onPlay={() => playAlbum(tracks, 'preserve', index)}
            />
          ))
        )}
      </div>

      {/* Only worth a footer when there is a full date to add to the header */}
      {album.releaseDate.length > 4 && (
        <p className='mt-4 text-xs text-muted-foreground'>
          {joinMeta(formatReleaseDate(album.releaseDate), length)}
        </p>
      )}

      <MoreByArtist album={album} artistLink={artistLink} />
    </PageBody>
  );
}

function MoreByArtist({
  album,
  artistLink,
}: {
  album: AlbumData;
  artistLink?: string;
}) {
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);

  useEffect(() => {
    setAlbums([]);
    if (!album.artistId) return;
    let cancelled = false;
    SourceManager.getInstance()
      .getArtistById(album.artistId, album.source)
      .then((artist) => {
        if (cancelled) return;
        setAlbums(
          [...(artist.albums ?? []), ...(artist.singles ?? [])].filter(
            (other) => other.id !== album.id
          )
        );
      })
      // An extra; the album page is complete without it
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [album.id, album.artistId, album.source]);

  if (albums.length === 0) return null;
  return (
    <Section
      title={`More by ${album.artist}`}
      action={
        artistLink && albums.length > MORE_BY_SHOWN ? (
          <Link
            href={artistLink}
            className='shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline'
          >
            Show all
          </Link>
        ) : undefined
      }
    >
      <MediaGrid>
        {albums.slice(0, MORE_BY_SHOWN).map((other) => (
          <AlbumCard key={other.id} album={other} showArtist={false} />
        ))}
      </MediaGrid>
    </Section>
  );
}
