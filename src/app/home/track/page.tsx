'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { useSongData } from '@/lib/hooks';
import { useQueueStore } from '@/lib/queue';
import { SourceManager } from '@/lib/sources/source-manager';
import { Lyrics, Song } from '@/lib/sources/types';
import {
  albumHref,
  artistHref,
  formatDuration,
  formatYear,
} from '@/lib/format';
import { Button } from '@/components/ui/button';
import { DetailHeader } from '@/components/media/detail-header';
import { SourceBadge } from '@/components/media/source-badges';
import { TrackRow } from '@/components/media/track-row';
import { Section, SectionAction } from '@/components/media/media-card';
import {
  DetailSkeleton,
  PageBody,
  PageError,
} from '@/components/media/page-state';
import { Videos } from '@/components/song-display/yt-videos';

const LYRIC_LINES_SHOWN = 6;
const ALBUM_TRACKS_SHOWN = 5;

export default function Page() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <TrackPage />
    </Suspense>
  );
}

function TrackPage() {
  const { data, loading, error, retry } = useSongData();
  const sourcesParam = useSearchParams().get('sources');

  // A merged search result passes along the track's id in its other sources
  const song = useMemo<Song | null>(() => {
    if (!data) return null;
    let sourceIds: Record<string, string> = {};
    try {
      sourceIds = sourcesParam ? JSON.parse(sourcesParam) : {};
    } catch {
      sourceIds = {};
    }
    sourceIds = { ...sourceIds, [data.source]: data.id };
    return { ...data, sourceIds, availableSources: Object.keys(sourceIds) };
  }, [data, sourcesParam]);

  if (loading) return <DetailSkeleton />;
  if (error || !song) {
    return (
      <PageError title="Couldn't load this song" error={error} onRetry={retry} />
    );
  }
  return <Track song={song} />;
}

function Track({ song }: { song: Song }) {
  const play = useQueueStore((state) => state.play);
  const playNext = useQueueStore((state) => state.playNext);
  const addToQueue = useQueueStore((state) => state.addToQueue);

  return (
    <PageBody>
      <DetailHeader
        label='Song'
        title={song.title}
        image={song.imageUrl}
        artist={song.artist}
        artistHref={
          song.artistId ? artistHref(song.artistId, song.source) : undefined
        }
        meta={
          <>
            {song.albumId ? (
              <Link
                href={albumHref(song.albumId, song.source)}
                className='hover:underline'
              >
                {song.album}
              </Link>
            ) : (
              song.album
            )}
            {[formatYear(song.releaseDate), formatDuration(song.duration)]
              .filter(Boolean)
              .map((part) => ` · ${part}`)}
          </>
        }
      >
        <div className='flex flex-wrap items-center gap-2'>
          <Button className='rounded-full px-5' onClick={() => play(song)}>
            <Play className='mr-2 h-4 w-4 fill-current' />
            Play
          </Button>
          <Button
            variant='secondary'
            className='rounded-full px-4'
            onClick={() => playNext(song)}
          >
            Play next
          </Button>
          <Button
            variant='secondary'
            className='rounded-full px-4'
            onClick={() => addToQueue(song)}
          >
            Add to queue
          </Button>
        </div>
      </DetailHeader>

      <div className='grid gap-x-8 lg:grid-cols-2'>
        <AvailableFrom song={song} />
        <LyricsPreview song={song} />
      </div>

      <FromAlbum song={song} />

      {typeof window !== 'undefined' && window.isTauri && (
        <Videos title={song.title} artist={song.artist} />
      )}
    </PageBody>
  );
}

/** Each source that has this track, in the order playback tries them. */
function AvailableFrom({ song }: { song: Song }) {
  const play = useQueueStore((state) => state.play);
  const [sources, setSources] = useState(() =>
    SourceManager.getInstance().getPlayableSources(song)
  );

  useEffect(() => {
    const manager = SourceManager.getInstance();
    const update = () => setSources(manager.getPlayableSources(song));
    update();
    return manager.onSourcesChange(update);
  }, [song]);

  return (
    <Section title='Available from'>
      {sources.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          None of your connected sources has this song right now.
        </p>
      ) : (
        <div className='flex flex-col gap-2'>
          {sources.map(({ sourceId, trackId }, index) => (
            <div
              key={sourceId}
              className='flex items-center gap-3 rounded-lg border border-border px-3 py-2'
            >
              <SourceBadge source={sourceId} />
              <span className='flex-1 text-xs text-muted-foreground'>
                {sources.length === 1
                  ? 'Only source'
                  : index === 0
                    ? 'Plays first'
                    : 'Fallback'}
              </span>
              <Button
                variant='secondary'
                size='icon'
                className='h-8 w-8 rounded-full'
                aria-label='Play from this source'
                // Narrowed to this one source so it is the one that plays
                onClick={() =>
                  play({
                    ...song,
                    id: trackId,
                    source: sourceId,
                    availableSources: [sourceId],
                    sourceIds: { [sourceId]: trackId },
                  })
                }
              >
                <Play className='h-3.5 w-3.5 fill-current' />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

const LYRICS_SOURCE_NAMES: Record<string, string> = {
  Navidrome: 'Navidrome',
  navidrome: 'Navidrome',
  musicKit: 'Apple Music',
  'LRC-LIB': 'LRCLIB',
};

function LyricsPreview({ song }: { song: Song }) {
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLyrics(null);
    setAll(false);
    SourceManager.getInstance()
      .getLyricsForSong(song)
      .then((result) => !cancelled && setLyrics(result))
      .catch(
        () =>
          !cancelled && setLyrics({ error: 'No lyrics found', source: '' })
      );
    return () => {
      cancelled = true;
    };
  }, [song]);

  const lines =
    lyrics && 'lines' in lyrics
      ? lyrics.lines.filter((line) => line.value?.trim())
      : [];

  return (
    <Section
      title='Lyrics'
      action={
        lines.length > LYRIC_LINES_SHOWN ? (
          <SectionAction onClick={() => setAll(!all)}>
            {all ? 'Show less' : 'Show all'}
          </SectionAction>
        ) : undefined
      }
    >
      <div className='rounded-lg bg-accent/50 px-4 py-3 text-sm'>
        {lyrics === null ? (
          <div className='space-y-2.5 py-1'>
            {['w-3/4', 'w-5/6', 'w-1/2', 'w-2/3'].map((width) => (
              <div
                key={width}
                className={`h-3 animate-pulse rounded bg-muted ${width}`}
              />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <p className='text-muted-foreground'>No lyrics for this song.</p>
        ) : (
          <>
            {(all ? lines : lines.slice(0, LYRIC_LINES_SHOWN)).map(
              (line, index) => (
                <p key={index} className='leading-7'>
                  {line.value}
                </p>
              )
            )}
            <p className='mt-2 text-xs text-muted-foreground'>
              {'synced' in lyrics && lyrics.synced ? 'Synced' : 'Not synced'}
              {' · from '}
              {LYRICS_SOURCE_NAMES[lyrics.source] ?? lyrics.source}
            </p>
          </>
        )}
      </div>
    </Section>
  );
}

/** The tracks around this one on its album. */
function FromAlbum({ song }: { song: Song }) {
  const playAlbum = useQueueStore((state) => state.playAlbum);
  const [tracks, setTracks] = useState<Song[]>([]);

  useEffect(() => {
    setTracks([]);
    if (!song.albumId) return;
    let cancelled = false;
    SourceManager.getInstance()
      .getAlbumData(song.albumId, song.source)
      .then((album) => !cancelled && setTracks(album.tracks ?? []))
      // An extra; the page is complete without it
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [song.albumId, song.source]);

  const position = tracks.findIndex((track) => track.id === song.id);
  if (!song.albumId || tracks.length < 2 || position === -1) return null;

  const start = Math.max(
    0,
    Math.min(
      position - Math.floor(ALBUM_TRACKS_SHOWN / 2),
      tracks.length - ALBUM_TRACKS_SHOWN
    )
  );

  return (
    <Section
      title={`From ${song.album}`}
      action={
        <Link
          href={albumHref(song.albumId, song.source)}
          className='shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline'
        >
          Open album
        </Link>
      }
    >
      <div className='-mx-2 flex flex-col'>
        {tracks
          .slice(start, start + ALBUM_TRACKS_SHOWN)
          .map((track, offset) => (
            <TrackRow
              key={track.id}
              song={track}
              number={track.trackNumber ?? start + offset + 1}
              showArtwork={false}
              onPlay={() => playAlbum(tracks, 'preserve', start + offset)}
            />
          ))}
      </div>
    </Section>
  );
}
