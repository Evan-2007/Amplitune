import { song as Song, albums as Album, artists as Artist } from '@/lib/sources/types';
import {SourceManager} from '@/lib/sources/source-manager';
import { useRouter } from 'next/navigation';
import { useQueueStore } from '@/lib/queue';

type SongItemProps =
  | { type: 'song'; data: Song }
  | { type: 'playlist'; data: any }
  | { type: 'album'; data: Album }
  | { type: 'artist'; data: Artist }
  | { type: 'video'; data: any };

export function SongItem({data, type}: SongItemProps) {
  
  const router = useRouter();
  const play = useQueueStore((state) => state.play);
  const handleClick = () => {

    if (type === 'song') {
      play(data);
    } else if (type === 'playlist') {
      router.push(`/playlist/${data.source}/${data.id}`);
    } else if (type === 'album') {
      router.push(`/album/${data.source}/${data.id}`);
    }
    else if (type === 'artist') {
      router.push(`/artist/${data.source}/${data.id}`);
    }
    else if (type === 'video') {
      router.push(`/video/${data.source}/${data.id}`);
    }

  };

  return (
    <div className='flex flex-row items-start space-x-3 p-2 hover:bg-gray-800 w-11/12' onClick={() => handleClick()}>
      <img src={data.imageUrl} alt={data.title} className={`w-12 h-12 ${type === 'song' ? 'rounded-md' : type === 'artist' ? 'rounded-lg' : ''}`} />
      <div className='flex flex-col w-full'>
        {type === 'song' ? (
          <>
            <p className='text-white font-bold'>{data.title}</p>
            <p className='text-gray-400'>{data.artist}</p>
          </>
        ) : type === 'artist' ? (
          <p className='text-white font-bold'>{data.name}</p>
        ) : type === 'album' ? (
          <p className='text-white font-bold'>{data.title}</p>
        ) : type === 'playlist' ? (
          <p className='text-white font-bold'>{data.title}</p>
        ) : (
          <p className='text-white font-bold'>{data.title}</p>
        )}
                
      </div>
    </div>
  );
}
