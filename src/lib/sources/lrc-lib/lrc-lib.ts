import {Lyrics} from '../types';
import { formatLyrics } from '@/lib/lyrics';

export async function getLRCLIBLyrics(title: string, artist: string, albume: string) {
    const formatParams = (param: string) => param.replace(/ /g, '+');
  
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
  
      // If the server returns an error
      if (data.error) {
        return {
          error: data.error,
          source: 'LRC-LIB',
        };
      }
  
      // If everything is OK
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
  