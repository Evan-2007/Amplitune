'use client';
import { Suspense } from 'react';
import { usePlaylistData } from '@/lib/hooks';
import { useQueueStore } from '@/lib/queue';
import { Playlist } from '@/lib/sources/types';
import { formatTotalDuration, joinMeta, pluralize } from '@/lib/format';
import { DetailHeader } from '@/components/media/detail-header';
import { TrackRow, TrackSubtitle } from '@/components/media/track-row';
import { PlayActions } from '@/components/media/play-actions';
import {
  DetailSkeleton,
  PageBody,
  PageError,
} from '@/components/media/page-state';

export default function Page() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PlaylistPage />
    </Suspense>
  );
}

function PlaylistPage() {
  const { data: playlist, loading, error, retry } = usePlaylistData();

  if (loading) return <DetailSkeleton />;
  if (error || !playlist) {
    return (
      <PageError
        title="Couldn't load this playlist"
        error={error}
        onRetry={retry}
      />
    );
  }
  return <PlaylistView playlist={playlist} />;
}

function PlaylistView({ playlist }: { playlist: Playlist }) {
  const playAlbum = useQueueStore((state) => state.playAlbum);
  const tracks = playlist.tracks ?? [];

  return (
    <PageBody>
      <DetailHeader
        label='Playlist'
        title={playlist.name}
        image={playlist.imageUrl}
        meta={joinMeta(
          pluralize(tracks.length, 'track'),
          formatTotalDuration(tracks)
        )}
        sources={[playlist.source]}
      >
        <PlayActions songs={tracks} />
      </DetailHeader>

      <div className='-mx-2 mt-6 flex flex-col border-t border-border pt-2'>
        {tracks.length === 0 ? (
          <p className='px-2 py-6 text-sm text-muted-foreground'>
            This playlist is empty.
          </p>
        ) : (
          tracks.map((song, index) => (
            <TrackRow
              // The same song can be in a playlist more than once
              key={`${song.id}-${index}`}
              song={song}
              subtitle={<TrackSubtitle song={song} />}
              onPlay={() => playAlbum(tracks, 'preserve', index)}
            />
          ))
        )}
      </div>
    </PageBody>
  );
}
