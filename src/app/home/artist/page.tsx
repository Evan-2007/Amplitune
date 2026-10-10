'use client';
import { Suspense, useEffect, useState } from 'react';
import { useArtistData } from '@/lib/hooks';
import { useQueueStore } from '@/lib/queue';
import { ArtistData } from '@/lib/sources/types';
import { formatReleaseDate, joinMeta, pluralize } from '@/lib/format';
import { HLSPlayer } from '@/components/ui/HLSPlayer';
import { Artwork } from '@/components/media/artwork';
import { SourceBadge } from '@/components/media/source-badges';
import { TrackRow, TrackSubtitle } from '@/components/media/track-row';
import {
  AlbumCard,
  MediaGrid,
  Section,
  SectionAction,
} from '@/components/media/media-card';
import { PlayActions } from '@/components/media/play-actions';
import {
  DetailSkeleton,
  ExpandableText,
  PageBody,
  PageError,
} from '@/components/media/page-state';

const TOP_SONGS_SHOWN = 5;
const RELEASES_SHOWN = 6;

export default function Page() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ArtistPage />
    </Suspense>
  );
}

function ArtistPage() {
  const { data: artist, loading, error, retry } = useArtistData();

  if (loading) return <DetailSkeleton />;
  if (error || !artist) {
    return (
      <PageError
        title="Couldn't load this artist"
        error={error}
        onRetry={retry}
      />
    );
  }
  // Keyed so "show all" toggles reset when moving to another artist
  return <Artist key={`${artist.source}-${artist.id}`} artist={artist} />;
}

function Artist({ artist }: { artist: ArtistData }) {
  const playAlbum = useQueueStore((state) => state.playAlbum);
  const [allSongs, setAllSongs] = useState(false);

  const songs = artist.songs ?? [];
  const shownSongs = allSongs ? songs : songs.slice(0, TOP_SONGS_SHOWN);
  const latest = artist.latestRelease;

  return (
    <div className='w-full'>
      <Banner artist={artist} />
      <PageBody className='pt-4'>
        <div className='flex items-center justify-between gap-4'>
          {songs.length > 0 ? <PlayActions songs={songs} /> : <div />}
          <SourceBadge source={artist.source} />
        </div>

        {(latest || songs.length > 0) && (
          <div
            className={
              latest && songs.length > 0
                ? 'grid gap-x-8 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]'
                : undefined
            }
          >
            {latest && (
              <Section title='Latest release'>
                <div className='-mx-2 max-w-56'>
                  <AlbumCard
                    album={latest}
                    subtitle={joinMeta(
                      formatReleaseDate(latest.releaseDate),
                      latest.totalTracks > 0 &&
                        pluralize(latest.totalTracks, 'track')
                    )}
                  />
                </div>
              </Section>
            )}
            {songs.length > 0 && (
              <Section
                title='Top songs'
                action={
                  songs.length > TOP_SONGS_SHOWN ? (
                    <SectionAction onClick={() => setAllSongs(!allSongs)}>
                      {allSongs ? 'Show less' : 'Show all'}
                    </SectionAction>
                  ) : undefined
                }
              >
                <div className='-mx-2 flex flex-col'>
                  {shownSongs.map((song, index) => (
                    <TrackRow
                      key={song.id}
                      song={song}
                      number={index + 1}
                      subtitle={<TrackSubtitle song={song} showArtist={false} />}
                      // Keeps what is queued and carries on down the list
                      onPlay={() => playAlbum(songs, 'preserve', index)}
                    />
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        <Releases title='Albums' albums={artist.albums ?? []} />
        <Releases title='Singles and EPs' albums={artist.singles ?? []} />

        {artist.bio && (
          <Section title='About'>
            <ExpandableText text={artist.bio} />
          </Section>
        )}

        {!latest &&
          songs.length === 0 &&
          !artist.albums?.length &&
          !artist.singles?.length && (
            <p className='mt-8 text-sm text-muted-foreground'>
              Nothing from this artist is available here yet.
            </p>
          )}
      </PageBody>
    </div>
  );
}

function Banner({ artist }: { artist: ArtistData }) {
  const image = artist.artwork?.url || artist.imageUrl;
  const video = artist.editorialVideo?.wide ?? artist.editorialVideo?.fullscreen;
  // A stream that will not play falls back to the artwork
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => setVideoFailed(false), [video]);

  return (
    <div className='relative flex h-56 w-full items-end overflow-hidden bg-zinc-900 md:h-72 md:rounded-t-xl'>
      {video && !videoFailed ? (
        <HLSPlayer
          src={video}
          onError={() => setVideoFailed(true)}
          className='absolute inset-0 h-full w-full object-cover'
        />
      ) : (
        image && (
          <img
            src={image}
            alt=''
            aria-hidden
            className='absolute inset-0 h-full w-full scale-125 object-cover blur-2xl'
          />
        )
      )}
      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10' />
      <div className='relative flex w-full items-end gap-4 p-4 md:p-8'>
        <Artwork
          src={image}
          alt={artist.name}
          kind='artist'
          className='h-24 w-24 shadow-lg md:h-32 md:w-32'
        />
        <div className='min-w-0 text-white'>
          <p className='text-xs text-white/70'>Artist</p>
          <h1 className='line-clamp-2 text-3xl font-bold md:text-5xl'>
            {artist.name}
          </h1>
          {!!artist.genres?.length && (
            <p className='mt-1 truncate text-sm text-white/70'>
              {artist.genres.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Releases({
  title,
  albums,
}: {
  title: string;
  albums: ArtistData['albums'];
}) {
  const [all, setAll] = useState(false);
  if (!albums?.length) return null;
  return (
    <Section
      title={title}
      action={
        albums.length > RELEASES_SHOWN ? (
          <SectionAction onClick={() => setAll(!all)}>
            {all ? 'Show less' : 'Show all'}
          </SectionAction>
        ) : undefined
      }
    >
      <MediaGrid>
        {(all ? albums : albums.slice(0, RELEASES_SHOWN)).map((album) => (
          <AlbumCard key={album.id} album={album} showArtist={false} />
        ))}
      </MediaGrid>
    </Section>
  );
}
