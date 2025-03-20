import React, { useEffect, useState } from 'react';
import XmlJS from 'xml-js';

declare global {
  interface Window {
    isTauri?: boolean;
  }
}
import { useQueueStore } from '@/lib/queue';
import { SourceManager } from '@/lib/sources/source-manager';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export interface SyllableLyrics {
  sections: {
    lines: {
      words: {
        value: string;
        start: number;
        end: number;
      }[];
      start: number;
      end: number;
      key: string;
      agent: string;
    }[];
    start: number;
    end: number;
    songPart: string;
  }[];

  lang: string;
  timing: string;
}

async function accessToken() {
  console.info('Fetching access token from webUI');
  const response = await tauriFetch('https://music.apple.com/us/browse', {
    method: 'GET',
    mode: 'no-cors',
  });

  if (response.status !== 200) {
    console.error('Failed to get music.apple.com! Please re-try...');
    throw new Error('Failed to get music.apple.com');
  }

  const htmlText = await response.text();
  const indexJsMatch = htmlText.match(/(?<=index)(.*?)(?=\.js")/);
  if (!indexJsMatch) {
    throw new Error('Could not find index JS file reference');
  }

  const indexJs = indexJsMatch[1];
  console.log(indexJs);
  const jsResponse = await tauriFetch(
    `https://music.apple.com/assets/index${indexJs}.js`
  );

  if (jsResponse.status !== 200) {
    console.error('Failed to get js library! Please re-try...');
    throw new Error('Failed to get js library');
  }

  const jsText = await jsResponse.text();
  const tokenMatch = jsText.match(/(?=eyJh)(.*?)(?=")/);

  if (!tokenMatch) {
    throw new Error('Could not find access token in JS file');
  }

  const accessToken = tokenMatch[1];
  console.log('Access token:', accessToken);
  return accessToken;
}

export async function getSyllableLyrics(
  setSyllableLyrics: (lyrics: SyllableLyrics) => void
) {
  if (!window.isTauri) {
    console.log('Not running in Tauri, cannot fetch syllable lyrics');
    return {
      error: 'Not running in Tauri',
    };
  }
  const token = await accessToken();
  const MediaUserToken = localStorage.getItem(
    'music.q222xnn59b.media-user-token'
  );
  try {
    const response = await tauriFetch(
      'https://amp-api.music.apple.com/v1/catalog/us/songs/1716102853/syllable-lyrics',
      {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: 'https://music.apple.com',
          'Media-User-Token': MediaUserToken || '',
        },
      }
    );
    const text = await response.text();
    const json = JSON.parse(text);
    if (json.data.length > 0) {
      const xml = json.data[0].attributes.ttml;
      const options = { compact: true, ignoreComment: true, spaces: 4 };
      const result = XmlJS.xml2js(xml, options) as any;
      console.log(result.tt);
      
      const syllableLyrics: SyllableLyrics = {
        sections: result.tt.body.div.map((section: any) => ({
          lines: section.p.map((line: any) => ({
            words: line.span.map((word: any) => ({
              value: word._text,
              start: parseFloat(word._attributes.begin),
              end: parseFloat(word._attributes.end),
            })),
            start: parseFloat(line._attributes.begin),
            end: parseFloat(line._attributes.end),
            key: line._attributes['itunes:key'],
            agent: line._attributes['ttm:agent'],
          })),
          start: parseFloat(section._attributes.begin),
          end: parseFloat(section._attributes.end),
          songPart: section._attributes['itunes:songPart'],
        })),
        lang: result.tt._attributes['xml:lang'],
        timing: result.tt._attributes['itunes:timing'],
      };
      console.log(syllableLyrics);
    }
    //   console.log(json);
  } catch (error) {
    console.error(error);
  }
}

interface LyricsDisplayProps {
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  isMouseMoving: boolean;
}

// export function SyncedLyrics({
//   isMobile,
//   containerRef,
//   isMouseMoving,
// }: LyricsDisplayProps) {
//   const currentQueue = useQueueStore((state) => state.queue);
//   const sourceManager = SourceManager.getInstance();

//   const [lyrics, setLyrics] = useState<SyllableLyrics | null>(null);
//   const [currentLine, setCurrentLine] = useState<number>(0);
//   const [error, setError] = useState<string | null>(null);

//   const songData = useQueueStore((state) => state.queue.currentSong?.track);

//   const handleLyricClick = (index: number) => {
//     setCurrentLine(index);
//   };

//   return (
//     <>
//       {error && (
//         <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
//           {error}
//         </p>
//       )}
//       {lyrics ? (
//         lyrics.map((line, index) => (
//           <button key={index} onClick={() => handleLyricClick(index)}>
//             <p
//               data-line={index}
//               className={`z-40 animate-[fade-in] text-wrap px-10 pb-6 text-center text-3xl font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-in-out md:px-16 md:pb-12 md:text-6xl ${
//                 index === currentLine
//                   ? 'scale-110 pb-10 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'
//                   : index > currentLine && !isMouseMoving
//                     ? 'scale-[80%] text-gray-400 blur-[7px]'
//                     : index > currentLine && isMouseMoving
//                       ? 'scale-[80%] text-gray-400 blur-0'
//                       : isMouseMoving
//                         ? 'group-hover:scale-[80%] group-hover:opacity-100'
//                         : 'text-gray-400 opacity-0 blur-[7px] transition-all duration-1000'
//               }`}
//             >
//               {line.value}
//             </p>
//             {line.value === '' && index === currentLine && (
//               <div className='mb-10 flex gap-2'>
//                 <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4'></div>
//                 <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4 delay-200'></div>
//                 <div className='aspect-square w-10 scale-75 animate-[pulse_3s_ease-out_infinite] rounded-full bg-white pb-4 pt-4 delay-500'></div>
//               </div>
//             )}
//           </button>
//         ))
//       ) : (
//         <p className='mt-6 text-center text-4xl font-bold text-gray-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'>
//           No lyrics found
//         </p>
//       )}
//     </>
//   );
// }
