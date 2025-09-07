'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/song-display/header';
import { SourceManager } from '@/lib/sources/source-manager';
import { useEffect, useState } from 'react';
import { AlbumData } from '@/lib/sources/types';
import { SongList } from '@/components/song-display/song-list';
import { Separator } from '@/components/ui/separator';
import { ArtistResponse } from '@/types/artistResponse';
import { HLSPlayer } from '@/components/ui/HLSPlayer';
import Image from 'next/image';
import { Description } from '@radix-ui/react-dialog';
import Link from 'next/link';


export default function Page() {
  return (
    <div className='flex h-full w-full flex-col items-center'>
      <Suspense fallback={<div>Loading...</div>}>
        <Album />
      </Suspense>
    </div>
  );
}

function Album() {
  const sourceManager = SourceManager.getInstance();

  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const source = searchParams.get('source');

  const [artistData, setArtistData] = useState<ArtistResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (id && source) {
      setLoading(true);
      sourceManager.getArtistById(id, source).then((data) => {
        setArtistData(data);
        console.log('Album data fetched:', data);
        setLoading(false);
      });
    }
  }, [id, source]);

  if (!artistData || loading) {
    return <div>Loading album data...</div>;
  }


    const artist = () => {
    if (artistData.type === 'appleMusic1') {
        return artistData.data;
    } else if (artistData.type === 'appleMusic2') {
        const artists = artistData.data.resources.artists;
        if (id) {
            return artists[id];
        } else {
            throw new Error('Artist id is null');
        }
    } else {
        throw new Error('Unknown artist data type');
    }
  }
  

const getVideoSrc = (): string | undefined => {
  if (artistData.type !== 'appleMusic2') return undefined;

  const artists = artistData.data?.resources?.artists;
  const artist = id ? artists?.[String(id)] : undefined;

  // return the video url or undefined
  return artist?.attributes?.editorialVideo?.motionArtistFullscreen16x9?.video ?? undefined;
};

const src = getVideoSrc();


if (artistData.type == 'appleMusic2') {
} if (artistData.type == 'appleMusic1') {
  
} else {
  console.warn('Unknown artist data type, cannot determine video availability');
}

let name: string | undefined;
let description: string | undefined;
if (
  (artistData.type === 'appleMusic1' && artistData.data.attributes?.name) ||
  (artistData.type === 'appleMusic2' && artistData.data.resources?.artists?.[id!]?.attributes?.name)
) {
  name = artist().attributes?.name;
}

if (artistData.type === 'appleMusic2') {
  description = artistData.data.resources?.artists?.[id!]?.attributes?.artistBio;
}

  const sortAlbumsByReleaseDate = () => {
    let albums = null;
    if (artistData.type === 'appleMusic1') {
      albums = artistData.data.relationships?.albums?.data || [];
    } else if (artistData.type === 'appleMusic2') {
      const albumsObj = artistData.data?.resources?.albums || {};
      albums = Object.values(albumsObj);
  }
    if (albums) {
      albums.sort((a, b) => {
        const dateA = new Date(a.attributes.releaseDate).getTime();
        const dateB = new Date(b.attributes.releaseDate).getTime();
        return dateB - dateA; // Newest first
      });
      return albums;
    }
    return [];
  };

  console.log("sorted albums:", sortAlbumsByReleaseDate());

  const mostRecentAlbum = () => {
    const albums = sortAlbumsByReleaseDate();
    return albums.length > 0 ? albums[0] : null;
  }

  let songs: any[] = [];
  if (artistData.type === 'appleMusic1' && artistData.data.relationships?.songs?.data) {
    songs = artistData.data.relationships?.songs?.data || [];
  } else if (artistData.type === 'appleMusic2' && artistData.data.resources?.songs) {
    songs = Object.values(artistData.data.resources?.songs || {});
  }


console.log('Video URL:', src);

  return (
    <div className='flex h-full w-full flex-col items-center'>
        <div className='flex h-[30vw] w-full flex-col items-center bg-black rounded-t-md overflow-hidden relative'>
            <div className='absolute'>
                {src ? <HLSPlayer src={src} /> : <div className='flex h-[30vw] w-full items-center justify-center text-white '>No video available</div>}
            </div>
            <div className='absolute bottom-0 left-0 0 w-full flex'>
                <Image src={artist().attributes?.artwork?.url.replace('{w}', '500').replace('{h}', '500').replace('{c}', 'cc').replace('{f}', 'webp') || '/placeholder.png'} alt={name || 'Artist Artwork'} width={180} height={180} className='rounded-full ml-6 mb-6' />
                <div className='flex flex-col justify-center ml-4 mb-6'>
                  <h1 className='text-white text-3xl font-bold '>{artist().attributes?.name}</h1>
                    <p className='text-gray-800 text-sm p-4 pr-6 w-1/2'>
                    {description ? (description.length > 180 ? description.slice(0, 180) + '...' : description) : ''}
                    </p>
                </div>

            </div>
        </div>

        <div className='w-full p-10 flex'>
            {sortAlbumsByReleaseDate().length > 0 && mostRecentAlbum()?.attributes &&
              <div>
                <h2 className='text-2xl font-bold mb-2'>New Release:</h2>
                <div className='flex flex-col md:flex-row items-start gap-4'>
                  <div className='relative'>
                    <Image src={mostRecentAlbum()?.attributes.artwork.url.replace('{w}', '500').replace('{h}', '500').replace('{c}', 'cc').replace('{f}', 'webp') || '' } width={180} height={180} alt={mostRecentAlbum()?.attributes.name || ''}></Image>
                  </div>
                  <div className='flex flex-col mt-2'>
                    <Link className='text-lg font-semibold mt-2 hover:underline' href={`/home/album?id=${mostRecentAlbum()?.id}&source=${artistData.type === 'appleMusic1' || artistData.type === 'appleMusic2' ? 'musicKit' : ''}`}> <p>{mostRecentAlbum()?.attributes.name}</p> </Link>
                    <div className='text-gray-600'>Released on: {new Date(mostRecentAlbum()?.attributes.releaseDate || '').toLocaleDateString()}</div>
                    <div className='text-gray-600'>Total Tracks: {mostRecentAlbum()?.attributes.trackCount}</div>
                  </div>
                </div>
              </div>
            }
            <div className='grid grid-cols-7 overflow-scroll'>
              {songs && songs.length > 0 && songs.map((song, index) => (
                <div key={index} className='mb-2'>
                  <Link className='text-md hover:underline' href={`/home/album?id=${song.relationships?.albums?.data[0]?.id || ''}&source=${artistData.type === 'appleMusic1' || artistData.type === 'appleMusic2' ? 'musicKit' : ''}`}> {song.attributes?.name} </Link>
                </div>
              ))}
            </div>
        </div>


      {/* <Header type='album' data={albumData} />
      <Separator className='my-2 mt-4 w-11/12' />
      {albumData.tracks && albumData.tracks.length > 0 && (
        <SongList songs={albumData.tracks} />
      )} */}
    </div>
  );
}


