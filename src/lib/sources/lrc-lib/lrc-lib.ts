import {Lyrics} from '../types';
import { formatLyrics } from '@/lib/lyrics';

export async function getLRCLIBLyrics(title: string, artist: string, albume: string): Promise<Lyrics> {
    try {
        await fetch(
            'https://lrclib.net/api/get?artist_name=' +
              title +
              '&track_name=' +
              artist +
              '&album_name=' +
              albume,
            {
              headers: {
                'Content-Type': 'application/json',
                'Lrclib-Client': `amplitune (https://github.com/Evan-2007/Amplitune)`,
              },
            }
            )
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    return {
                        error: data.error,
                        source: 'LRC-LIB'
                    }
                }
                return {
                    lines: formatLyrics(data.syncedLyrics),
                    source: 'LRC-LIB'
                }
            });

    } catch (error) {
        return {
            error: error,
            source: 'LRC-LIB'
        }
    }
}
