import { Lyrics } from '../../types';
import { subsonicBaseUrl } from './subsonic';

export async function getLyrics(trackId: string): Promise<Lyrics> {
  try {
    const url = await subsonicBaseUrl(
      '/rest/getLyricsBySongId.view',
      `&id=${trackId}`
    );
    const response = await fetch(url);
    if (!response.ok) {
      return {
        error: response.statusText,
        source: 'Navidrome',
      };
    }
    const data = await response.json();
    if (data['subsonic-response'].status === 'failed') {
      return {
        error: data['subsonic-response'].error.message,
        source: 'Navidrome',
      };
    }
    if (data['subsonic-response'].lyricsList.structuredLyrics.length > 0) {
      return {
        lines: data['subsonic-response'].lyricsList.structuredLyrics[0].line,
        source: 'Navidrome',
        synced: data['subsonic-response'].lyricsList.structuredLyrics[0].synced,
      };
    } else {
      return {
        error: 'No lyrics found',
        source: 'Navidrome',
      };
    }
  } catch (error) {
    return {
      // The lyrics view renders this, so it has to be a string, not an Error
      error: error instanceof Error ? error.message : String(error),
      source: 'Navidrome',
    };
  }
}
