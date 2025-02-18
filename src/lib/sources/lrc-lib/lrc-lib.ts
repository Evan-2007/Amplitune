import {Lyrics} from '../types';
import { formatLyrics } from '@/lib/lyrics';

export async function getLRCLIBLyrics(title: string, artist: string, albume: string) {
    const formatParams = (param: string) => encodeURIComponent(param).replace(/%20/g, '+');
  
    try {
      const response = await fetch(
        'https://lrclib.net/api/get?artist_name=' +
          formatParams(artist) +
          '&track_name=' +
          formatParams(title),
        {
          headers: {
            'Content-Type': 'application/json',
            'Lrclib-Client': `amplitune (https://github.com/Evan-2007/Amplitune)`,
          },
        },
      );
  
      const data = await response.json();
  

      if (data.error) {
        return {
          error: data.error,
          source: 'LRC-LIB',
        };
      }
  
      return {
        lines: formatLyrics(data.syncedLyrics),
        source: 'LRC-LIB',
        synced: true,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  